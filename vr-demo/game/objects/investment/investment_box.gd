extends Node3D

@export var countdown_seconds: int = 5
@export var growth_scale: float = 3.0
@export var snap_require_group: String = "fits_in_storage" # Ensure your money item is in this group, or change here

var _current_item: Node3D = null
var _remaining: int = 0

@onready var _snap_zone: Node = $SnapZone
@onready var _label: Label3D = $CountdownLabel
@onready var _timer: Timer = $CountdownTimer
@onready var _release_point: Marker3D = $ReleasePoint

func _ready() -> void:
	# Wire up snap-zone signals
	if _snap_zone.has_signal("has_picked_up"):
		_snap_zone.connect("has_picked_up", Callable(self, "_on_snap_picked_up"))
	if _snap_zone.has_signal("has_dropped"):
		_snap_zone.connect("has_dropped", Callable(self, "_on_snap_dropped"))
	
	# Initialize label
	_label.text = "Place Money"
	_label.visible = true
	
	# Configure snap filter if provided
	if snap_require_group != "":
		_snap_zone.snap_require = snap_require_group

func _on_snap_picked_up(what: Node) -> void:
	# Start a fresh countdown for the new item
	_current_item = what
	_remaining = countdown_seconds
	_label.text = str(_remaining)
	_label.visible = true
	
	# Temporarily make the item ungrabbable while it "invests"
	if _current_item is XRToolsPickable:
		(_current_item as XRToolsPickable).enabled = false
	
	_timer.stop()
	_timer.wait_time = 1.0
	_timer.one_shot = false
	if not _timer.is_connected("timeout", Callable(self, "_on_timer_tick")):
		_timer.connect("timeout", Callable(self, "_on_timer_tick"))
	_timer.start()

func _on_snap_dropped() -> void:
	# Cancel countdown when item is removed early; re-enable grabbable
	_timer.stop()
	if _current_item is XRToolsPickable:
		(_current_item as XRToolsPickable).enabled = true
	_current_item = null
	_label.text = "Place Money"
	_label.visible = true

func _on_timer_tick() -> void:
	_remaining -= 1
	if _remaining > 0:
		_label.text = str(_remaining)
		return
	
	# Reached zero
	_timer.stop()
	_label.text = "0"
	_mature_and_release()

func _mature_and_release() -> void:
	var item := _current_item
	_current_item = null
	if not is_instance_valid(item):
		_label.text = "Place Money"
		return
	
	# Drop from snap zone first so we can reposition and scale without it being held
	if _snap_zone and _snap_zone.has_method("drop_object"):
		_snap_zone.drop_object()
	
	# Wait one frame so the grab-driver releases fully
	await get_tree().process_frame
	if not is_instance_valid(item):
		_label.text = "Place Money"
		return
	
	# Temporarily freeze to apply transform safely
	var rb := item as RigidBody3D
	if rb:
		rb.freeze = true
	
	# Scale up massively
	item.scale *= Vector3.ONE * max(1.0, growth_scale)
	
	# Move to the release point above/near the box to avoid clipping
	if is_instance_valid(_release_point):
		var basis := item.global_transform.basis
		item.global_transform = Transform3D(basis, _release_point.global_transform.origin)
	
	# Unfreeze and re-enable so it's grabbable again
	if rb:
		rb.freeze = false
	if item is XRToolsPickable:
		(item as XRToolsPickable).enabled = true
	
	# Optional: small upward nudge so it settles nicely
	if rb:
		rb.linear_velocity = Vector3(0, 0.2, 0)
	
	# Update label and reset after a short delay
	_label.text = "Grown!"
	await get_tree().create_timer(1.0).timeout
	_label.text = "Place Money"
