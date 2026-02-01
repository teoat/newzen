
import asyncio
import uuid
import time
from app.core.event_bus import event_bus, EventType, publish_event

async def verify_instrumentation():
    print("🧪 STARTING V3 EVENT INSTRUMENTATION CHECK")
    print("------------------------------------------")
    
    # 0. Setup Consumer Group FIRST
    if not event_bus.redis:
        print("   ⚠️ Redis Client not available")
        return

    group_name = f"verifier_{int(time.time())}"
    try:
        # id='0' means we want to read from the very beginning of the stream
        event_bus.redis.xgroup_create(event_bus.stream_key, group_name, id='0', mkstream=True)
        print(f"   ✅ Created temporary consumer group: {group_name}")
    except Exception as e:
        print(f"   ℹ️ Group creation note: {e}")

    # 1. Simulate DATA_UPLOADED (Ingestion)
    print("1. Firing DATA_UPLOADED event...")
    ingestion_id = uuid.uuid4().hex
    msg_id_1 = publish_event(
        EventType.DATA_UPLOADED,
        {
            "filename": "test_ledger.csv",
            "ingestion_id": ingestion_id,
            "size_bytes": 1024
        },
        project_id="test_project_v3"
    )
    print(f"   -> Published! ID: {msg_id_1}")

    # 2. Simulate EVIDENCE_ADDED (Evidence)
    print("2. Firing EVIDENCE_ADDED event...")
    doc_id = uuid.uuid4().hex
    msg_id_2 = publish_event(
        EventType.EVIDENCE_ADDED,
        {
            "document_id": doc_id,
            "filename": "invoice_scan.pdf",
            "case_id": "case_123"
        },
        project_id="test_project_v3",
        user_id="verifier"
    )
    print(f"   -> Published! ID: {msg_id_2}")
    
    # 3. Consume events to verify persistence
    print("3. Reading from Redis Stream to verify persistence...")
    if not event_bus.redis:
        print("   ⚠️ Redis Client not available (Mock mode maybe?)")
        return

    # Create a temp consumer group just for verification
    group_name = f"verifier_{int(time.time())}"
    try:
        event_bus.redis.xgroup_create(event_bus.stream_key, group_name, mkstream=True)
    except Exception:
        pass # Group might exist
        
    # Read
    messages = event_bus.redis.xreadgroup(
        group_name, 
        "worker_1", 
        {event_bus.stream_key: ">"}, 
        count=5
    )
    
    found_types = []
    if messages:
        for stream, msgs in messages:
            for msg_id, data in msgs:
                # Handle possible string/bytes depending on decode_responses
                event_type = data.get("type") or data.get(b"type")
                if isinstance(event_type, bytes):
                    event_type = event_type.decode("utf-8")
                
                if not event_type:
                    event_type = "UNKNOWN"

                found_types.append(event_type)
                print(f"   ✅ Found Event in Stream: {event_type} (ID: {msg_id})")
                
                # Ack
                event_bus.redis.xack(event_bus.stream_key, group_name, msg_id)
    
    if EventType.DATA_UPLOADED in found_types and EventType.EVIDENCE_ADDED in found_types:
        print("\n🎉 SUCCESS: All V3 Events successfully instrumented and flowing!")
    else:
        print(f"\n⚠️ WARNING: Missing events. Found: {found_types}")

if __name__ == "__main__":
    asyncio.run(verify_instrumentation())
