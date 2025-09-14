extends Node

@export var ws_port: int = 8787
@export var spawn_parent_path: NodePath = NodePath("../")

var _ws: WebSocketServer

func _ready() -> void:
	_ws = WebSocketServer.new()
	var err = _ws.listen(ws_port, PackedStringArray(["investbuddy.v1"]))
	if err != OK:
		push_error("[GoalEventListener] WebSocket listen failed: %s" % str(err))
		return
	set_process(true)
	print("[GoalEventListener] Listening on ws://127.0.0.1:%d" % ws_port)

func _process(_delta: float) -> void:
	if _ws == null:
		return
	_ws.poll()
	# Handle incoming packets from all peers
	for id in _ws.get_peer_ids():
		var peer: WebSocketPeer = _ws.get_peer(id)
		while peer.get_available_packet_count() > 0:
			var pkt: PackedByteArray = peer.get_packet()
			var txt := pkt.get_string_from_utf8()
			print("[GoalEventListener] Received: ", txt)
			_handle_message(txt)

func _handle_message(text: String) -> void:
	var data = JSON.parse_string(text)
	if not (data is Dictionary):
		print("[GoalEventListener] Ignoring non-JSON message")
		return
	# Scenario trigger
	if data.has("type") and String(data["type"]) == "scenario":
		var name := String(data.get("name", ""))
		if name.to_lower() == "compounding":
			_start_compounding_garden()
			return
		print("[GoalEventListener] Unknown scenario: ", name)
		return
	# Goal-complete spawn
	var prompt_text := ""
	if data.has("prompt") and typeof(data["prompt"]) == TYPE_STRING:
		prompt_text = String(data["prompt"]) 
	elif data.has("name") and typeof(data["name"]) == TYPE_STRING:
		prompt_text = "A 3D model of %s" % String(data["name"]) 
	else:
		print("[GoalEventListener] Missing 'prompt' or 'name' in message")
		return
	_spawn_model(prompt_text)

func _spawn_model(prompt_text: String) -> void:
	var parent: Node = get_node_or_null(spawn_parent_path)
	if parent == null:
		parent = self
	# Dynamically create a spawner instance with the provided prompt
	var spawner := Node3D.new()
	spawner.set_script(load("res://game/zones/outside/ai_model_spawner.gd"))
	spawner.set("prompt", prompt_text)
	parent.add_child(spawner)
	print("[GoalEventListener] Spawned AIModelSpawner with prompt=\"%s\"" % prompt_text)

func _start_compounding_garden() -> void:
	var parent: Node = get_node_or_null(spawn_parent_path)
	if parent == null:
		parent = self
	var garden := Node3D.new()
	garden.set_script(load("res://game/scenarios/compounding_garden.gd"))
	parent.add_child(garden)
	garden.global_position = Vector3(0, 0.0, 0)
	print("[GoalEventListener] Compounding Garden started.")
