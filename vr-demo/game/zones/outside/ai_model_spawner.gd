extends Node3D

@export var prompt: String = "A sci-fi spaceship with glowing engines, highly detailed"
@export var placeholder_scene_path: String = "res://game/items/rock/rock.tscn"
@export var spawn_height: float = 0.1
# Showcase controls
@export var showcase_scale: float = 4.0
@export var showcase_hover_height: float = 1.5
@export var spin_speed_deg: float = 20.0
@export var bob_amplitude: float = 0.25
@export var bob_speed_hz: float = 0.5
@export var retexture_prompt: String = "game-ready realistic PBR textures"

const API_URL: String = "https://api.meshy.ai/v2/text-to-3d"
const RETEXTURE_URL: String = "https://api.meshy.ai/v1/retexture"
const POLL_INTERVAL = 5.0
const POLL_MAX_SECONDS = 900.0

var _spinner: Node3D
var _http: HTTPRequest
var _has_spawned = false

# Placeholder and imported roots
var _placeholder_root: Node3D
var _import_root: Node3D
var _showcase_root: Node3D

# Showcase animation state
var _spin_enabled = false
var _bobbing_t = 0.0
var _ground_y = 0.0

# Polling state (preview)
var _api_key = ""
var _current_task_id = ""
var _poll_http: HTTPRequest
var _poll_attempts = 0
var _poll_start_msec = 0

# Retexture state
var _retexture_task_id = ""
var _retex_http: HTTPRequest
var _retex_poll_http: HTTPRequest

# Download state
var _download_http: HTTPRequest
var _download_path = ""

func _ready() -> void:
	# Position the spawner at requested X/Z and configured Y height
	global_position = Vector3(global_position.x, spawn_height, global_position.z)
	
	if _has_spawned:
		return
	
	_load_env_and_override_prompt()
	_show_spinner()
	print("[AIModelSpawner] Ready at %s. Prompt=\"%s\"" % [str(global_position), prompt])
	_start_generation()

func _load_env_and_override_prompt() -> void:
	var p = _read_env_var("MESHY_PROMPT")
	if p != "":
		prompt = p
	var tp = _read_env_var("MESHY_RETEXTURE_PROMPT")
	if tp != "":
		retexture_prompt = tp

func _get_env_path() -> String:
	var script_path = get_script().resource_path
	var base_dir: String = "res://"
	if script_path != "":
		base_dir = script_path.get_base_dir()
	return base_dir + "/.env"

func _read_env_var(key: String) -> String:
	var value = ""
	var env_path = _get_env_path()
	if FileAccess.file_exists(env_path):
		var f = FileAccess.open(env_path, FileAccess.READ)
		if f:
			while not f.eof_reached():
				var line = f.get_line().strip_edges()
				if line == "" or line.begins_with("#"):
					continue
				var eq = line.find("=")
				if eq > 0:
					var k = line.substr(0, eq).strip_edges()
					var v = line.substr(eq + 1, line.length() - (eq + 1)).strip_edges()
					if k == key:
						value = v
						break
			f.close()
	if value == "":
		value = OS.get_environment(key)
	return value

func _start_generation() -> void:
	_api_key = _read_env_var("MESHY_API_KEY")
	if _api_key == "" or _api_key == "YOUR_MESHY_API_KEY":
		push_warning("[AIModelSpawner] MESHY_API_KEY not set; skipping API call and spawning placeholder.")
		# Simulate a short loading period so the spinner is visible
		await get_tree().create_timer(1.5).timeout
		_hide_spinner()
		_spawn_placeholder_with_effect()
		return
	
	_http = HTTPRequest.new()
	_http.request_completed.connect(Callable(self, "_on_request_completed"))
	_http.timeout = 60
	_http.use_threads = true
	add_child(_http)
	
	var body = {
		"mode": "preview",
		"prompt": prompt,
		"art_style": "realistic",
		"should_remesh": true,
		"enable_pbr": false
	}
	
	var headers = [
		"Authorization: Bearer %s" % _api_key,
		"Content-Type: application/json"
	]
	
	print("[AIModelSpawner] Sending POST to %s with prompt length=%s" % [API_URL, str(prompt.length())])
	var err = _http.request(API_URL, headers, HTTPClient.METHOD_POST, JSON.stringify(body))
	if err != OK:
		push_error("[AIModelSpawner] Meshy POST request failed to start: %s" % err)
		_hide_spinner()
		_spawn_placeholder_with_effect()
		return
	print("[AIModelSpawner] POST started, awaiting response...")

func _on_request_completed(_result, response_code, _headers, body) -> void:
	print("[AIModelSpawner] POST response received: code=%s" % str(response_code))
	var text = body.get_string_from_utf8()
	print("[AIModelSpawner] POST body (truncated 500): %s" % text.substr(0, 500))
	var data = JSON.parse_string(text)
	if response_code >= 200 and response_code < 300 and data is Dictionary and data.has("result"):
		var task_id = data["result"]
		_current_task_id = str(task_id)
		print("[AIModelSpawner] Meshy generation task started. Task ID: %s" % _current_task_id)
		# Keep spinner visible while we poll and fetch the final model
		# Keep spinner visible while we poll and fetch the final model
		_spawn_placeholder_with_effect()
		_begin_polling_task(_current_task_id)
	else:
		push_warning("[AIModelSpawner] Meshy API response error (code %s): %s" % [str(response_code), text])
		_hide_spinner()

func _begin_polling_task(task_id: String) -> void:
	_poll_attempts = 0
	_poll_start_msec = Time.get_ticks_msec()
	print("[AIModelSpawner] Begin polling task %s every %ss (timeout %ss)" % [task_id, str(POLL_INTERVAL), str(POLL_MAX_SECONDS)])
	_ensure_poll_http()
	_do_poll()

func _ensure_poll_http() -> void:
	if _poll_http == null:
		_poll_http = HTTPRequest.new()
		_poll_http.request_completed.connect(Callable(self, "_on_poll_completed"))
		_poll_http.timeout = 60
		_poll_http.use_threads = true
		add_child(_poll_http)

func _do_poll() -> void:
	if _current_task_id == "":
		return
	var elapsed = (Time.get_ticks_msec() - _poll_start_msec) / 1000.0
	if elapsed > POLL_MAX_SECONDS:
		push_warning("[AIModelSpawner] Polling timed out after %ss for task %s" % [str(POLL_MAX_SECONDS), _current_task_id])
		return
	_poll_attempts += 1
	var url = API_URL + "/" + _current_task_id
	var headers = ["Authorization: Bearer %s" % _api_key]
	print("[AIModelSpawner] Poll %s: GET %s" % [str(_poll_attempts), url])
	var err = _poll_http.request(url, headers, HTTPClient.METHOD_GET)
	if err != OK:
		push_warning("[AIModelSpawner] Poll request failed to start: %s" % str(err))
		# schedule next try
		var t1 = get_tree().create_timer(POLL_INTERVAL)
		t1.timeout.connect(Callable(self, "_do_poll"))

func _on_poll_completed(_result, response_code, _headers, body) -> void:
	var text = body.get_string_from_utf8()
	print("[AIModelSpawner] Poll response code=%s; body (truncated 500): %s" % [str(response_code), text.substr(0, 500)])
	if response_code < 200 or response_code >= 300:
		# schedule next try unless timeout
		var t0 = get_tree().create_timer(POLL_INTERVAL)
		t0.timeout.connect(Callable(self, "_do_poll"))
		return
	var data = JSON.parse_string(text)
	if not (data is Dictionary):
		print("[AIModelSpawner] Poll JSON parse returned non-dict")
		var t2 = get_tree().create_timer(POLL_INTERVAL)
		t2.timeout.connect(Callable(self, "_do_poll"))
		return
	var status = str(data["status"]) if data.has("status") else "(missing)"
	var progress = str(data["progress"]) if data.has("progress") else "(missing)"
	print("[AIModelSpawner] Task %s status=%s progress=%s" % [_current_task_id, status, progress])
	if status == "SUCCEEDED":
		# Start retexture immediately in background
		_begin_retexture(_current_task_id)
		if data.has("model_urls") and data["model_urls"] is Dictionary and data["model_urls"].has("glb"):
			var glb_url = str(data["model_urls"]["glb"])
			print("[AIModelSpawner] Model ready. GLB URL: %s" % glb_url)
			_on_model_ready(glb_url)
		else:
			print("[AIModelSpawner] SUCCEEDED but no model_urls.glb present")
		return
	elif status == "FAILED" or status == "CANCELED":
		var err_msg = ""
		if data.has("task_error") and data["task_error"] is Dictionary and data["task_error"].has("message"):
			err_msg = str(data["task_error"]["message"])
		push_warning("[AIModelSpawner] Task %s ended: %s. Error=%s" % [_current_task_id, status, err_msg])
		return
	# else keep polling
	var t3 = get_tree().create_timer(POLL_INTERVAL)
	t3.timeout.connect(Callable(self, "_do_poll"))

func _on_model_ready(glb_url: String) -> void:
	print("[AIModelSpawner] Downloading GLB from: %s" % glb_url)
	_download_model(glb_url)

func _begin_retexture(preview_task_id: String) -> void:
	if _retex_http == null:
		_retex_http = HTTPRequest.new()
		_retex_http.timeout = 60
		_retex_http.use_threads = true
		_retex_http.request_completed.connect(Callable(self, "_on_retexture_post_completed"))
		add_child(_retex_http)
	var body = {
		"input_task_id": preview_task_id,
		"text_style_prompt": retexture_prompt,
		"enable_original_uv": true,
		"enable_pbr": true
	}
	var headers = [
		"Authorization: Bearer %s" % _api_key,
		"Content-Type: application/json"
	]
	print("[AIModelSpawner] Starting retexture for preview task %s" % preview_task_id)
	var err = _retex_http.request(RETEXTURE_URL, headers, HTTPClient.METHOD_POST, JSON.stringify(body))
	if err != OK:
		push_warning("[AIModelSpawner] Retexture POST failed to start: %s" % str(err))

func _on_retexture_post_completed(_result, response_code, _headers, body) -> void:
	var text = body.get_string_from_utf8()
	print("[AIModelSpawner] Retexture POST response code=%s body(500)=%s" % [str(response_code), text.substr(0,500)])
	if response_code < 200 or response_code >= 300:
		push_warning("[AIModelSpawner] Retexture POST error: code=%s" % str(response_code))
		return
	var data = JSON.parse_string(text)
	if data is Dictionary and data.has("result"):
		_retexture_task_id = str(data["result"])
		print("[AIModelSpawner] Retexture task started: %s" % _retexture_task_id)
		_begin_retexture_poll()
	else:
		push_warning("[AIModelSpawner] Retexture POST missing result: %s" % text)

func _begin_retexture_poll() -> void:
	if _retex_poll_http == null:
		_retex_poll_http = HTTPRequest.new()
		_retex_poll_http.use_threads = true
		_retex_poll_http.timeout = 60
		_retex_poll_http.request_completed.connect(Callable(self, "_on_retexture_poll_completed"))
		add_child(_retex_poll_http)
	_do_retexture_poll()

func _do_retexture_poll() -> void:
	if _retexture_task_id == "":
		return
	var url = "https://api.meshy.ai/v1/retexture/" + _retexture_task_id
	var headers = ["Authorization: Bearer %s" % _api_key]
	print("[AIModelSpawner] Retexture poll: GET %s" % url)
	var err = _retex_poll_http.request(url, headers, HTTPClient.METHOD_GET)
	if err != OK:
		push_warning("[AIModelSpawner] Retexture poll request failed to start: %s" % str(err))
		var t = get_tree().create_timer(POLL_INTERVAL)
		t.timeout.connect(Callable(self, "_do_retexture_poll"))

func _on_retexture_poll_completed(_result, response_code, _headers, body) -> void:
	var text = body.get_string_from_utf8()
	print("[AIModelSpawner] Retexture poll code=%s body(500)=%s" % [str(response_code), text.substr(0,500)])
	if response_code < 200 or response_code >= 300:
		var t0 = get_tree().create_timer(POLL_INTERVAL)
		t0.timeout.connect(Callable(self, "_do_retexture_poll"))
		return
	var data = JSON.parse_string(text)
	if not (data is Dictionary):
		var t1 = get_tree().create_timer(POLL_INTERVAL)
		t1.timeout.connect(Callable(self, "_do_retexture_poll"))
		return
	var status = str(data["status"]) if data.has("status") else "(missing)"
	var progress = str(data["progress"]) if data.has("progress") else "(missing)"
	print("[AIModelSpawner] Retexture status=%s progress=%s" % [status, progress])
	if status == "SUCCEEDED":
		if data.has("model_urls") and data["model_urls"] is Dictionary and data["model_urls"].has("glb"):
			var glb_url = str(data["model_urls"]["glb"])
			print("[AIModelSpawner] Retextured GLB ready: %s" % glb_url)
			_on_model_ready(glb_url)
		else:
			print("[AIModelSpawner] Retexture SUCCEEDED but no glb url")
		return
	elif status == "FAILED" or status == "CANCELED":
		var err_msg = ""
		if data.has("task_error") and data["task_error"] is Dictionary and data["task_error"].has("message"):
			err_msg = str(data["task_error"]["message"])
		push_warning("[AIModelSpawner] Retexture ended: %s err=%s" % [status, err_msg])
		return
	var t2 = get_tree().create_timer(POLL_INTERVAL)
	t2.timeout.connect(Callable(self, "_do_retexture_poll"))

func _download_model(url: String) -> void:
	if _download_http == null:
		_download_http = HTTPRequest.new()
		_download_http.use_threads = true
		_download_http.timeout = 120
		_download_http.request_completed.connect(Callable(self, "_on_download_completed"))
		add_child(_download_http)
	var headers = ["Authorization: Bearer %s" % _api_key]
	var err = _download_http.request(url, headers, HTTPClient.METHOD_GET)
	if err != OK:
		push_error("[AIModelSpawner] Download request failed to start: %s" % str(err))

func _on_download_completed(_result, response_code, _headers, body: PackedByteArray) -> void:
	print("[AIModelSpawner] Download response: code=%s, size=%s bytes" % [str(response_code), str(body.size())])
	if response_code < 200 or response_code >= 300 or body.size() == 0:
		push_warning("[AIModelSpawner] Download failed or empty body. code=%s" % str(response_code))
		return
	# Ensure cache dir
	var cache_dir = "user://meshy_models"
	if not DirAccess.dir_exists_absolute(cache_dir):
		var derr = DirAccess.make_dir_absolute(cache_dir)
		if derr != OK:
			push_error("[AIModelSpawner] Could not create cache dir: %s" % str(derr))
			return
	_download_path = "%s/%s.glb" % [cache_dir, _current_task_id]
	var f = FileAccess.open(_download_path, FileAccess.WRITE)
	if f == null:
		push_error("[AIModelSpawner] Could not open file for write: %s" % _download_path)
		return
	f.store_buffer(body)
	f.flush()
	f.close()
	print("[AIModelSpawner] Saved GLB to: %s" % _download_path)
	_import_and_spawn_glb(_download_path)

func _import_and_spawn_glb(path: String) -> void:
	print("[AIModelSpawner] Importing GLB from: %s" % path)
	var gltf = GLTFDocument.new()
	var state = GLTFState.new()
	var err = gltf.append_from_file(path, state)
	if err != OK:
		push_error("[AIModelSpawner] GLTF append_from_file failed: %s" % str(err))
		return
	var imported_scene: Node = null
	if gltf.has_method("generate_scene"):
		imported_scene = gltf.generate_scene(state)
	elif gltf.has_method("import_scene"):
		imported_scene = gltf.import_scene(state)
	if imported_scene == null:
		push_error("[AIModelSpawner] GLTF generate/import scene returned null")
		return
	# Remove placeholder if present
	if _placeholder_root != null and is_instance_valid(_placeholder_root):
		_placeholder_root.queue_free()
		_placeholder_root = null
	# Hide spinner now that we're spawning the real model
	_hide_spinner()
	# Create/ensure showcase anchor
	_ensure_showcase()
	# Replace any existing preview/textured root
	if _import_root != null and is_instance_valid(_import_root):
		_import_root.queue_free()
	_import_root = Node3D.new()
	_showcase_root.add_child(_import_root)
	var model_n3d: Node3D = null
	print("[AIModelSpawner] Imported root type: %s" % imported_scene.get_class())
	if imported_scene is Node3D:
		model_n3d = imported_scene as Node3D
		_import_root.add_child(model_n3d)
	else:
		# Wrap non-Node3D root in a Node3D so we can transform it
		model_n3d = Node3D.new()
		_import_root.add_child(model_n3d)
		model_n3d.add_child(imported_scene)
	# Start small and pop-in to target showcase scale
	model_n3d.scale = Vector3(0.01, 0.01, 0.01)
	var tw = create_tween()
	tw.tween_property(model_n3d, "scale", Vector3.ONE * showcase_scale, 0.9).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	# Enable spin + bob showcase
	_spin_enabled = true
	print("[AIModelSpawner] Model spawned into world (showcase).")

func _ensure_showcase() -> void:
	if _showcase_root != null and is_instance_valid(_showcase_root):
		return
	_showcase_root = Node3D.new()
	add_child(_showcase_root)
	# Compute ground height at spawner position
	_ground_y = _get_ground_height_at(global_position)
	_showcase_root.global_position = Vector3(global_position.x, _ground_y + showcase_hover_height, global_position.z)

func _get_ground_height_at(pos: Vector3) -> float:
	var space = get_world_3d().direct_space_state
	var from = pos + Vector3(0, 10.0, 0)
	var to = pos + Vector3(0, -50.0, 0)
	var params = PhysicsRayQueryParameters3D.create(from, to)
	params.collide_with_areas = false
	params.collision_mask = 1 # "Static World" layer
	var hit = space.intersect_ray(params)
	if hit.has("position"):
		var p: Vector3 = hit["position"]
		return p.y
	return pos.y

func _show_spinner() -> void:
	print("[AIModelSpawner] Showing spinner...")
	_spinner = Node3D.new()
	add_child(_spinner)
	
	var ring = MeshInstance3D.new()
	var cyl = CylinderMesh.new()
	cyl.top_radius = 0.5
	cyl.bottom_radius = 0.5
	cyl.height = 0.02
	cyl.radial_segments = 64
	ring.mesh = cyl
	
	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color(0.2, 0.8, 1.0, 0.6)
	mat.roughness = 0.1
	mat.metallic = 0.6
	ring.material_override = mat
	
	_spinner.add_child(ring)
	set_process(true)

func _process(delta: float) -> void:
	if _spinner != null:
		_spinner.rotate_y(3.0 * delta)
	# Rotate and bob the showcase root (trophy display)
	if _spin_enabled and _showcase_root != null and is_instance_valid(_showcase_root):
		_showcase_root.rotate_y(deg_to_rad(spin_speed_deg) * delta)
		_bobbing_t += delta * (2.0 * PI) * bob_speed_hz
		var y = _ground_y + showcase_hover_height + sin(_bobbing_t) * bob_amplitude
		var gp = _showcase_root.global_position
		_showcase_root.global_position = Vector3(gp.x, y, gp.z)

func _hide_spinner() -> void:
	if _spinner != null:
		print("[AIModelSpawner] Hiding spinner")
		_spinner.queue_free()
		_spinner = null
		set_process(false)

func _spawn_placeholder_with_effect() -> void:
	if _has_spawned:
		return
	_has_spawned = true
	
	print("[AIModelSpawner] Spawning placeholder object with effects")
	_placeholder_root = Node3D.new()
	add_child(_placeholder_root)
	
	var spawned: Node3D
	var ps = load(placeholder_scene_path)
	if ps is PackedScene:
		spawned = ps.instantiate()
	else:
		# Fallback primitive
		var mi = MeshInstance3D.new()
		var sm = SphereMesh.new()
		sm.radius = 0.35
		mi.mesh = sm
		spawned = mi
	
	_placeholder_root.add_child(spawned)
	spawned.position = Vector3.ZERO
	spawned.scale = Vector3(0.01, 0.01, 0.01)
	
	# Simple pop-in scale tween
	var tw = create_tween()
	tw.tween_property(spawned, "scale", Vector3.ONE, 0.7).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	
	# Quick light flash
	var light = OmniLight3D.new()
	light.light_energy = 8.0
	light.omni_range = 3.0
	_placeholder_root.add_child(light)
	var tw_light = create_tween()
	tw_light.tween_property(light, "light_energy", 0.0, 0.6).set_ease(Tween.EASE_IN)
	var free_timer = get_tree().create_timer(0.65)
	free_timer.timeout.connect(Callable(light, "queue_free"))
	
	# Small particle burst
	var particles = GPUParticles3D.new()
	var process_mat = ParticleProcessMaterial.new()
	process_mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
	process_mat.emission_sphere_radius = 0.25
	process_mat.initial_velocity_min = 0.5
	process_mat.initial_velocity_max = 2.0
	process_mat.spread = 180.0
	process_mat.gravity = Vector3(0, -9.8, 0)
	particles.amount = 60
	particles.one_shot = true
	particles.lifetime = 0.6
	particles.process_material = process_mat
	_placeholder_root.add_child(particles)
	particles.restart()
