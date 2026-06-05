# Security Specification: Tutoring Association App

This document outlines the security invariants, payload attack vectors ("The Dirty Dozen"), and corresponding permission logic for the Firestore Collections: `users`, `study-materials`, `appointments`, `session-videos`, `progress-metrics`, and `chat-messages`.

## 1. Data Invariants

1. **Role Separation**: Only verified users or users with specified profiles can access documents. An attendee cannot write or update a user profile they don't own.
2. **Material uploads**: Uploads can only be created by users with a `tutor` role.
3. **Appointment Status Locking**: A cancelled appointment can never undergo additional updates.
4. **Chat Message Integrity**: Messages must represent the actual authentic sender UID. Users cannot forge messages where `senderId` != `request.auth.uid`.
5. **Private Content Access**: Private files (`study-materials`, `session-videos`) are accessible to authorized students or generalized grade-level bounds.
6. **Time Integrity**: All creations and edits use server-side `request.time` timestamps for correctness. Client modifications of system-owned timelines are rejected.

---

## 2. The "Dirty Dozen" Meltdown Payloads

Below are the 12 malicious payload vectors designed to stress-test other layers, and how the firestore rule structure mathematically prohibits them from committing:

### Pillar 1: Identity & Profile Spoofing
1. **The Self-Promoted Tutor**: A student tries to register as a `role == "tutor"` during registry to gain upload/management rights.
   - *Status*: **REJECTED**. The user validator checks profile role assignment.
2. **The Silhouette Profile Write**: A logged-in student updates someone else's user profile document to inject malicious content.
   - *Status*: **REJECTED**. Checked via `isOwner(userId)` where `/users/{userId}` requires matching `request.auth.uid`.

### Pillar 2: Study Materials Privilege Escalation
3. **The Counterfeit Study Guide**: A standard student user tries to call a `create` on `/study-materials/{materialId}` with a malware download link, bypassing tutor verification.
   - *Status*: **REJECTED**. The rule verifies that only users whose database record confirms `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'tutor'` can upload.
4. **The Ghost Field Override**: A student tries to update `uploadedBy` of a study resource, trying to orphan files or trick systems into shifting ownership.
   - *Status*: **REJECTED**. Immutability rule verifies `incoming().uploadedBy == existing().uploadedBy`.

### Pillar 3: Booking & Cancellation Hijacks
5. **The Stranger Appointment Crash**: User B tries to cancel or call delete/cancel updates on an appointment set up between User A and a Tutor.
   - *Status*: **REJECTED**. Appointments are protected by verifying `request.auth.uid == resource.data.studentId` or `request.auth.uid == resource.data.tutorId`.
6. **The Immutable State Override**: A student tries to reschedule a cancelled appointment (`status == "cancelled"`) back to `scheduled`, violating scheduling laws.
   - *Status*: **REJECTED**. Once an appointment status transitions to `cancelled` (terminal state), updates are locked.

### Pillar 4: Chat Message Forgeries
7. **The Impersonated Tutor message**: Student UID A posts a message in chat where they set `senderId: "TUTOR_UID"`, fabricating instructions from the instructor.
   - *Status*: **REJECTED**. Message verification checks `incoming().senderId == request.auth.uid`.
8. **The Chat Snoop list**: A student queries the entire `chat-messages` collection without filtering to read other students' private message records.
   - *Status*: **REJECTED**. The lists rule evaluates `resource.data.senderId == request.auth.uid || resource.data.receiverId == request.auth.uid` explicitly, forcing proper query filters.

### Pillar 5: Video Session & Metrics Intercepts
9. **The Video Leak Scout**: Student A queries another student's specific private virtual class recording video.
   - *Status*: **REJECTED**. Recording rule ensures `resource.data.studentId == request.auth.uid || resource.data.studentId == "all"`.
10. **The Self-Evaluated Straight A**: A student modifies their `/progress-metrics/{studentId}` document in the database, setting `syllabusCoverage: 100` and `hoursCompleted: 9999` to cheat.
    - *Status*: **REJECTED**. Metrics collection write permissions are restricted strictly to tutors.

### Pillar 6: Resource Poisoning
11. **The ID Poisoning Bomb**: A cyber attacker attempts to create a document under an extremely long, invalid ID `/chat-messages/__MALICIOUS_LONG_ID_WITH_SPECIAL_CHARS__` to crash indices.
    - *Status*: **REJECTED**. Rigorous `isValidId(id)` constraint restricts length to `128` characters and verifies alphanumeric character sets.
12. **The Denial-of-Wallet Payload**: Creating a study worksheet with an extremely bloated file URL or giant description array to cost-attack storage structures.
    - *Status*: **REJECTED**. Fields are capped specifically at standard boundary limits (e.g. `title.size() <= 100`, `fileUrl.size() <= 500`).
