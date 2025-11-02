"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import {
  checkNotificationPermission,
  requestNotificationPermission,
  loadNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from "@/lib/notifications/browser-notifications";

/**
 * 알림 설정 관리 컴포넌트
 * Phase 10: SCH-US-03
 */
export function NotificationSettingsPanel() {
  const [permission, setPermission] = useState<"default" | "granted" | "denied">("default");
  const [settings, setSettings] = useState<NotificationSettings>(loadNotificationSettings());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPermission(checkNotificationPermission());
    setSettings(loadNotificationSettings());
  }, []);

  const handleRequestPermission = async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | number) => {
    const updated = updateNotificationSettings({ [key]: value });
    setSettings(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 설정은 이미 localStorage에 저장되어 있음
      await new Promise((resolve) => setTimeout(resolve, 300)); // UI 피드백용
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">알림 설정</h2>
        <p className="mt-2 text-sm text-gray-600">일정 리마인더 알림 설정을 관리할 수 있습니다.</p>
      </div>

      {/* 브라우저 알림 권한 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">브라우저 알림 권한</h3>
            <p className="mt-1 text-sm text-gray-600">
              {permission === "granted"
                ? "브라우저 알림 권한이 허용되어 있습니다."
                : permission === "denied"
                  ? "브라우저 알림 권한이 거부되었습니다. 브라우저 설정에서 변경하세요."
                  : "브라우저 알림 권한을 요청하세요."}
            </p>
          </div>
          {permission !== "granted" && (
            <button
              onClick={handleRequestPermission}
              disabled={permission === "denied"}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {permission === "denied" ? "권한 거부됨" : "권한 요청"}
            </button>
          )}
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">알림 옵션</h3>

        <div className="space-y-4">
          {/* 알림 활성화 */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="enabled" className="text-sm font-medium text-gray-900">
                알림 활성화
              </label>
              <p className="mt-1 text-sm text-gray-600">일정 리마인더 알림을 받으려면 활성화하세요.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={settings.enabled}
                onChange={(e) => handleSettingChange("enabled", e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300" />
            </label>
          </div>

          {/* 브라우저 알림 */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="browserNotifications" className="text-sm font-medium text-gray-900">
                브라우저 알림
              </label>
              <p className="mt-1 text-sm text-gray-600">브라우저 알림을 통해 일정 리마인더를 받습니다.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id="browserNotifications"
                checked={settings.browserNotifications}
                onChange={(e) => handleSettingChange("browserNotifications", e.target.checked)}
                disabled={permission !== "granted" || !settings.enabled}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
            </label>
          </div>

          {/* 기본 리마인더 시간 */}
          <div>
            <label htmlFor="reminderMinutes" className="block text-sm font-medium text-gray-900">
              기본 리마인더 시간 (분)
            </label>
            <p className="mt-1 mb-2 text-sm text-gray-600">
              일정 시작 전 몇 분 전에 알림을 받을지 설정합니다.
            </p>
            <select
              id="reminderMinutes"
              value={settings.reminderMinutes}
              onChange={(e) => handleSettingChange("reminderMinutes", parseInt(e.target.value, 10))}
              disabled={!settings.enabled}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="0">알림 없음</option>
              <option value="5">5분 전</option>
              <option value="10">10분 전</option>
              <option value="15">15분 전</option>
              <option value="30">30분 전</option>
              <option value="60">1시간 전</option>
              <option value="120">2시간 전</option>
              <option value="1440">1일 전</option>
            </select>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/schedules"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          취소
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

