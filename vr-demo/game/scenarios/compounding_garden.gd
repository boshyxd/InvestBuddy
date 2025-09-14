extends Node3D

@export var garden_center: Vector3 = Vector3(0, 0.1, 0)
@export var lane_spacing: float = 3.5
@export var years: int = 10
@export var seconds_per_year: float = 0.75
@export var principal: float = 1000.0
@export var early_rate: float = 0.10
@export var late_rate: float = 0.10
@export var late_start_delay_years: int = 3
@export var bar_height_scale: float = 0.01
@export var ai_enabled: bool = true

var _year_t := 0.0
var _elapsed_years := 0
var _running := false

var _bar_now: MeshInstance3D
var _bar_late: MeshInstance3D
var _label_now: Label3D
var _label_late: Label3D

func _ready() -> void:
	# Layout two lanes: Start Now (left), Start Later (right)
	var left_x = garden_center.x - lane_spacing * 0.5
	var right_x = garden_center.x + lane_spacing * 0.5
	
	_bar_now = _make_bar(Color(0.0, 0.6, 1.0))
	_bar_now.global_position = Vector3(left_x, garden_center.y, garden_center.z)
	add_child(_bar_now)
	
	_bar_late = _make_bar(Color(0.2, 0.9, 0.4))
	_bar_late.global_position = Vector3(right_x, garden_center.y, garden_center.z)
	add_child(_bar_late)
	
	_label_now = _make_label("Start Now")
	_label_now.global_position = _bar_now.global_position + Vector3(0, 0.2, 0)
	add_child(_label_now)
	
	_label_late = _make_label("Start Later (+%d yrs)" % late_start_delay_years)
	_label_late.global_position = _bar_late.global_position + Vector3(0, 0.2, 0)
	add_child(_label_late)
	
	if ai_enabled:
		_spawn_ai_backdrop()
	
	_running = true
	set_process(true)

func _process(delta: float) -> void:
	if not _running:
		return
	_year_t += delta
	if _year_t >= seconds_per_year:
		_year_t = 0.0
		_elapsed_years += 1
		_update_growth()
		if _elapsed_years >= years:
			_running = false
			_spawn_result_trophy()

func _make_bar(col: Color) -> MeshInstance3D:
	var mi = MeshInstance3D.new()
	var cube = BoxMesh.new()
	cube.size = Vector3(0.4, 0.01, 0.4)
	mi.mesh = cube
	var mat = StandardMaterial3D.new()
	mat.albedo_color = col
	mi.material_override = mat
	return mi

func _make_label(text: String) -> Label3D:
	var lbl = Label3D.new()
	lbl.text = text
	lbl.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	lbl.font_size = 36
	lbl.outline_size = 8
	lbl.modulate = Color(1,1,1)
	return lbl

func _update_growth() -> void:
	# Compute values
	var years_now = _elapsed_years
	var years_late = max(0, _elapsed_years - late_start_delay_years)
	var value_now = principal * pow(1.0 + early_rate, years_now)
	var value_late = (years_late > 0) ? principal * pow(1.0 + late_rate, years_late) : 0.0
	
	# Visual scale by height; keep base anchored at ground
	var h_now = max(0.05, float(value_now) * bar_height_scale)
	var h_late = max(0.05, float(value_late) * bar_height_scale)
	_set_bar_height(_bar_now, h_now)
	_set_bar_height(_bar_late, h_late)
	
	# Update labels
	_label_now.text = "Start Now\n$%s" % _fmt(value_now)
	_label_late.text = "Start Later (+%d)\n$%s" % [late_start_delay_years, _fmt(value_late)]

func _set_bar_height(mi: MeshInstance3D, h: float) -> void:
	if mi.mesh is BoxMesh:
		var bm: BoxMesh = mi.mesh
		bm.size = Vector3(bm.size.x, h, bm.size.z)
	mi.global_position = Vector3(mi.global_position.x, garden_center.y + h * 0.5, mi.global_position.z)

func _fmt(x: float) -> String:
	return String.num(x, 0)

func _spawn_ai_backdrop() -> void:
	# Spawn AI-generated planters and signage using existing spawner script
	var titles = [
		"Compounding Garden sign, wood plank with carved letters, cozy, game-ready",
		"Planter box with soil, labeled 'Start Now', stylized, game-ready",
		"Planter box with soil, labeled 'Start Later', stylized, game-ready",
	]
	var offsets = [Vector3(0, 0.1, -1.5), Vector3(-lane_spacing * 0.5, 0.1, 0.0), Vector3(lane_spacing * 0.5, 0.1, 0.0)]
	for i in titles.size():
		var s := Node3D.new()
		s.set_script(load("res://game/zones/outside/ai_model_spawner.gd"))
		s.set("prompt", titles[i])
		add_child(s)
		s.global_position = garden_center + offsets[i]

func _spawn_result_trophy() -> void:
	# Spawn an AI "trophy" celebrating compounding
	var s := Node3D.new()
	s.set_script(load("res://game/zones/outside/ai_model_spawner.gd"))
	s.set("prompt", "Golden compounding trophy, upward arrows and leaves, game-ready, realistic PBR textures")
	add_child(s)
	s.global_position = garden_center + Vector3(0, 0.1, 2.0)