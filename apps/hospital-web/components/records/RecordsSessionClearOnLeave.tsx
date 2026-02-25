'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  SESSION_KEY_RECORD_PATIENT_ID,
  SESSION_KEY_RECORD_PIN_CODE,
  SESSION_KEY_RECORD_EDIT_PAYLOAD,
} from '@/lib/records-session';

const RECORDS_PATH_PREFIX = '/records';

/**
 * /records 밖으로 나갈 때만 진료 기록 세션(patientId, pinCode 등) 제거.
 * create ↔ view 이동 시에는 제거하지 않고, dashboard/설정 등으로 나갈 때만 제거.
 */
export function RecordsSessionClearOnLeave() {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || pathname == null) return;

    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    // 이전에 /records 안에 있었고, 지금은 밖이면 제거
    if (
      prev != null &&
      prev.startsWith(RECORDS_PATH_PREFIX) &&
      !pathname.startsWith(RECORDS_PATH_PREFIX)
    ) {
      sessionStorage.removeItem(SESSION_KEY_RECORD_PATIENT_ID);
      sessionStorage.removeItem(SESSION_KEY_RECORD_PIN_CODE);
      sessionStorage.removeItem(SESSION_KEY_RECORD_EDIT_PAYLOAD);
    }
  }, [pathname]);

  return null;
}
