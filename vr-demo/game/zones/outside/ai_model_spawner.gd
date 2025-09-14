extends Node3D

@export var prompt: String = "A sci-fi spaceship with glowing engines, highly detailed"
@export var placeholder_scene_path: String = "res://game/items/rock/rock.tscn"
@export var spawn_height: float = 0.1

const API_URL := "https://api.meshy.ai/v2/text-to-3d"

var _spinner: Node3D
var _http: HTTPRequest
var _has_spawned := false

func _ready() -> void:
	# Place this spawner in the middle of the outside scene
	global_position = Vector3(0.0, spawn_height, 0.0)
	
	if _has_spawned:
		return
	
	_load_env_and_override_prompt()
	_show_spinner()
	_start_generation()

func _load_env_and_override_prompt() -> void:
	var p := _read_env_var("MESHY_PROMPT")
	if p != "":
		prompt = p

func _get_env_path() -> String:
	var script_path := get_script().resource_path
	var base_dir := script_path != "" ? script_path.get_base_dir() : "res://"
	return base_dir + "/.env"

func _read_env_var(key: String) -> String:
	var value := ""
	var env_path := _get_env_path()
	if FileAccess.file_exists(env_path):
		var f := FileAccess.open(env_path, FileAccess.READ)
		if f:
			while not f.eof_reached():
				var line := f.get_line().strip_edges()
				if line == "" or line.begins_with("#"):
					continue
				var eq := line.find("=")
				if eq > 0:
					var k := line.substr(0, eq).strip_edges()
					var v := line.substr(eq + 1, line.length() - (eq + 1)).strip_edges()
					if k == key:
						value = v
						break
			f.close()
	if value == "":
		value = OS.get_environment(key)
	return value

func _start_generation() -> void:
	var api_key := _read_env_var("MESHY_API_KEY")
	if api_key == "" or api_key == "YOUR_MESHY_API_KEY":
		push_warning("MESHY_API_KEY not set; skipping API call and spawning placeholder.")
		# Simulate a short loading period so the spinner is visible
		await get_tree().create_timer(1.5).timeout
		_hide_spinner()
		_spawn_placeholder_with_effect()
		return
	
	_http = HTTPRequest.new()
	_http.request_completed.connect(_on_request_completed)
	_http.timeout = 30
	_http.use_threads = true
	add_child(_http)
	
	var body := {
		"mode": "preview",
		"prompt": prompt,
		"art_style": "realistic",
		"should_remesh": true,
		"enable_pbr": false
	}
	
	var headers := PackedStringArray([
		"Authorization: Bearer %s" % api_key,
		"Content-Type: application/json"
	])
	
	var err := _http.request(API_URL, headers, HTTPClient.METHOD_POST, JSON.stringify(body))
	if err != OK:
		push_error("Meshy POST request failed to start: %s" % err)
		_hide_spinner()
		_spawn_placeholder_with_effect()

func _on_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	_hide_spinner()
	var text := body.get_string_from_utf8()
	var data := JSON.parse_string(text)
	if response_code >= 200 and response_code < 300 and data is Dictionary and data.has("result"):
		var task_id = data["result"]
		print("Meshy generation task started. Task ID: %s" % str(task_id))
		# For now, we just spawn a placeholder while the background task runs.
		# You can extend this to poll Meshy for completion and download the GLB, then load at runtime.
		_spawn_placeholder_with_effect()
	else:
		push_warning("Meshy API response error (code %s): %s" % [str(response_code), text])
		_spawn_placeholder_with_effect()

func _show_spinner() -> void:
	_spinner = Node3D.new()
	add_child(_spinner)
	
	var ring := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = 0.5
	cyl.bottom_radius = 0.5
	cyl.height = 0.02
	cyl.radial_segments = 64
	ring.mesh = cyl
	
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.2, 0.8, 1.0, 0.6)
	mat.roughness = 0.1
	mat.metallic = 0.6
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	ring.material_override = mat
	
	_spinner.add_child(ring)
	set_process(true)

func _process(delta: float) -> void:
	if _spinner != null:
		_spinner.rotate_y(3.0 * delta)

func _hide_spinner() -> void:
	if _spinner != null:
		_spinner.queue_free()
		_spinner = null
		set_process(false)

func _spawn_placeholder_with_effect() -> void:
	if _has_spawned:
		return
	_has_spawned = true
	
	var spawn_root := Node3D.new()
	add_child(spawn_root)
	
	var spawned: Node3D
	var ps := load(placeholder_scene_path)
	if ps is PackedScene:
		spawned = (ps as PackedScene).instantiate()
	else:
		# Fallback primitive
		var mi := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 0.35
		mi.mesh = sm
		spawned = mi
	
	spawn_root.add_child(spawned)
	spawned.position = Vector3.ZERO
	spawned.scale = Vector3(0.01, 0.01, 0.01)
	
	# Simple pop-in scale tween
	var tw := create_tween()
	tw.tween_property(spawned, "scale", Vector3.ONE, 0.7).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	
	# Quick light flash
	var light := OmniLight3D.new()
	light.light_energy = 8.0
	light.range = 3.0
	spawn_root.add_child(light)
	var tw_light := create_tween()
	tw_light.tween_property(light, "light_energy", 0.0, 0.6).set_ease(Tween.EASE_IN)
	tw_light.finished.connect(func(): light.queue_free())
	
	# Small particle burst
	var particles := GPUParticles3D.new()
	var process_mat := ParticleProcessMaterial.new()
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
	spawn_root.add_child(particles)
	particles.restart()
