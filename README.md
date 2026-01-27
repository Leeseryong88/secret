# 익명 만료형 채팅 서비스 (Anonymous Secret Chat)

로그인 없이 누구나 채팅방을 만들고, 채팅방 ID와 비밀번호만으로 입장해 대화할 수 있는 보안 중심 익명 채팅 웹앱입니다.

## 핵심 기능

- **무계정 익명성**: 가입이나 로그인 없이 즉시 사용 가능 (Firebase Anonymous Auth 활용)
- **자동 소멸 (TTL)**: 설정된 만료 시간(최대 24시간)이 지나면 모든 데이터(채팅 로그, 메타데이터)가 서버에서 영구 삭제됩니다.
- **접근 제어**: 방 ID와 비밀번호를 아는 사람만 입장 가능합니다. 비밀번호는 서버에 해시되어 저장됩니다.
- **시간 연장**: 만료 2시간 전부터 "4시간 연장" 버튼이 활성화되어 대화를 지속할 수 있습니다.

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Firebase (Firestore, Auth, Cloud Functions, Cloud Scheduler)

## 설치 및 실행

1. 의존성 설치:
   ```bash
   npm install
   ```

2. 환경 변수 설정 (`.env.local`):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. 개발 서버 실행:
   ```bash
   npm run dev
   ```

## Firebase 설정 가이드

### 1. Firestore 보안 규칙 (Security Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      // 방 정보는 ID를 알 때만 읽기 가능
      allow get: if true;
      // 방 생성은 인증된 익명 사용자만 가능
      allow create: if request.auth != null;
      // 연장은 만료 전일 때만 가능
      allow update: if request.auth != null && resource.data.expiresAt > request.time;
      
      match /messages/{messageId} {
        // 메시지 읽기/쓰기는 방이 활성 상태일 때만 가능
        allow read, write: if request.auth != null && get(/databases/$(database)/documents/rooms/$(roomId)).data.expiresAt > request.time;
      }
    }
  }
}
```

### 2. Cloud Functions (데이터 자동 삭제 로직)

만료된 방을 자동으로 삭제하기 위해 Firebase Cloud Functions와 Cloud Scheduler를 사용합니다.

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const cleanupExpiredRooms = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    const expiredRooms = await db.collection('rooms')
      .where('expiresAt', '<', now)
      .limit(100)
      .get();

    const batch = db.batch();

    for (const room of expiredRooms.docs) {
      // 1. 하위 메시지 삭제
      const messages = await room.ref.collection('messages').get();
      messages.forEach(msg => batch.delete(msg.ref));
      
      // 2. 방 문서 삭제
      batch.delete(room.ref);
    }

    await batch.commit();
    console.log(`${expiredRooms.size} expired rooms cleaned up.`);
  });
```

## 보안 주의사항

- 이 서비스는 서버 측 데이터 삭제를 보장하지만, 클라이언트 측의 스크린샷이나 브라우저 캐시를 통한 유출은 막을 수 없습니다.
- 완전한 보안을 위해 향후 Phase 2에서 종단간 암호화(E2EE) 도입을 권장합니다.
