# 🕵️ Scribe Sigil: Complete Game Walkthrough

Welcome to the official walkthrough for **Scribe Sigil**. This guide provides a step-by-step path to solving the hit-and-run mystery and identifying the perpetrator.

---

## 📱 Pre-Investigation: Pairing Detective Handheld Terminal

Before accessing the workstation, connect your smartphone:

1. Click **START INVESTIGATION** on the main title screen.
2. Scan the on-screen **QR Code** with your phone's camera (or navigate to `http://<your-ip>:8000/phone.html`).
3. Your mobile device pairs with the workstation as an encrypted Tokyo Metropolitan Police Field Terminal.
4. Click **PROCEED TO WORKSTATION**.

---

## 🛠️ Phase 1: Accessing the System

The game begins with a Windows XP-style lock screen.

1. **Select User:** Administrator
2. **Password Decryption:** Click *"Forgot password?"* to view the Caesar cipher: `kdfnwrehu`. Walking each letter 3 steps backward reveals:
3. **Password:** `hacktober`
4. **Objective:** Gain access to the desktop environment.

> [!NOTE]
> Once logged in, you will find several applications: File Explorer, Tokyo Police, Internet Explorer, Calculator, Notepad, and Email.

---

## 🚔 Phase 2: The Wiretap, PC Lockdown & Sensor Recovery

As soon as you attempt to investigate official police files by opening any application window (such as **Tokyo Police** or **File Explorer**):

1. **The First Call (Loudspeaker Warning):**
   * Your connected phone terminal will ring with an incoming call from `UNKNOWN CALLER`.
   * Answer the call: the suspect's threatening voice broadcasts on **loudspeaker**, ordering you to cease the investigation and shut down the computer immediately.
   * Hang up the call.
2. **The 5-Second Shutdown & PC Lockdown:**
   * Exactly 5 seconds after hanging up, your PC monitor flickers into a critical **Remote Takeover / Lockdown Screen** (`CRITICAL SECURITY BREACH: TERMINAL ACCESS SUSPENDED`).
   * The computer demands an emergency recovery key.
3. **Carrier Signal Lost (Shake Sensor):**
   * Simultaneously, your phone screen corrupts with digital static (`CARRIER OVERLOAD`).
   * **Shake your physical phone vigorously** back and forth (using your device's accelerometer) until the frequency buffer reaches 100%.
4. **The Second Call (Hold to Ear with Riddle):**
   * Once re-synced, an encrypted transmission rings your phone (`ENCRYPTED WHISPER`).
   * Answer the call. The voice presents a riddle:
     > *"Can't hear me over the static? Secrets are not shouted into the room... Bring this phone close to your ear."*
   * **Hold the phone vertically against your ear** (using your phone's gyroscope / tilt sensor).
   * As soon as the device detects ear proximity, the static disappears and the caller clearly whispers the emergency override code:
     > **`SHADOW7743`**
5. **Restoring the PC Workstation:**
   * Type `SHADOW7743` into the locked PC monitor and click **RECOVER SYSTEM**.
   * The intrusion backdoor is purged, and full access to your Windows XP workstation is restored.

---

## 📂 Phase 2B: The Tokyo Police Database Login

Now that the system is restored, proceed with official law enforcement files:

1. **Gather Credentials:** Open **File Explorer**. Locate the file `police_admin.mp4`.
2. **Login to Police App:** 
    * **Officer ID:** `police_admin` (from the video filename).
    * **Password:** `28481211`.
3. **Analyze Evidence:**
    * Open **Audio Evidence**.
    * Listen to the files `GAY.mp3` and `STRAIGHT.mp3`.
    * Activate **"Reverse Mode"** to hear hidden messages or codes.

---

## 📄 Phase 3: Case #2024-7743 (The Hit & Run)

Inside the police database, you'll find the primary case files.

1.  **Unlock Case Report:** Use the password `iamalive`.
2.  **Review the Report:**
    *   **Victim:** Tanaka Hiroshi.
    *   **Incident:** Hit-and-run at Shibuya Crossing, Oct 15.
    *   **Vehicle:** Black Metallic BMW 5-Series (2020-2023).
    *   **Suspect Initials:** M.K.
3.  **Binary Decryption:** Note the binary code on Page 4:
    `01100100 01110010 00101110 00111011 00111000 00100001 00110111`
    *   **Result:** `dr.;8!7` (This is the Instagram password).

---

## 📸 Phase 4: Social Media Extraction

Hiroshi's digital footprint holds the key to the motive.

1.  **Navigate to Instagram:** Open **Internet Explorer** and enter the URL: `instagram://profile/tanaka_hiroshi_dev`.
2.  **Login:**
    *   **Username:** `tanaka_hiroshi_dev`
    *   **Password:** `dr.;8!7`
3.  **Investigate DMs:** Read the conversation with `unknown_sender`.
    *   **Discovery:** Hiroshi was being blackmailed for ¥5M regarding a corporate leak. He paid ¥2M, but still owes **¥3M**.

---

## 📝 Phase 5: The Hidden Personal Notes

The blackmailer's demands provide a clue to unlock Hiroshi's private thoughts.

1.  **Calculator Input:** Open the **Calculator** and enter the remaining debt: `3000000`. Press **=**.
2.  **Unlock Notepad:** The Notepad icon on the desktop is now accessible.
3.  **The "Select All" Secret:**
    *   Open Notepad. It contains ordinary work notes.
    *   Press `Ctrl+A` or use the mouse to highlight all text.
    *   **Hidden Message Revealed:** Hiroshi's private email address is `t.hiroshi.evidence@outlook.com`.

---

## 📧 Phase 6: Securing the Final Evidence

The victim's email inbox contains the most damning evidence.

1.  **Email Login:**
    *   **Address:** `t.hiroshi.evidence@outlook.com`
    *   **Password:** `HELP`
2.  **The Password Logic:** Take the first letter of the heading from each of the four pages of the Police Case Report:
    *   **H**it (Page 1)
    *   **E**yewitness (Page 2)
    *   **L**aboratory (Page 3)
    *   **P**rogress (Page 4)
3.  **Inbox Analysis:** Review emails from `unknown_sender@darkmail.net` (M.K.) which confirm the blackmail and the "Project Horizon" connection.

---

## 🔍 Phase 7: Identifying the Perpetrator

With all evidence gathered, return to the **Tokyo Police** app and open the **Suspects Database**.

### The Evidence Profile:
| Category | Requirement |
| :--- | :--- |
| **Initials** | M.K. |
| **Vehicle** | BMW 5-Series (2020-2023), Black Metallic |
| **Membership** | Royal Golf Club (Tokyo) |
| **Connection** | Tech Corp Executive, Project Horizon bidder |

### 🏆 The Culprit: Masato Kurosawa
**Suspect #1** is the only one who matches all criteria. He used his position at Tech Corp to discover Hiroshi's leak, blackmailed him for millions, and ultimately took extreme measures at Shibuya Crossing when the full payment wasn't met.

---
*End of Walkthrough*
