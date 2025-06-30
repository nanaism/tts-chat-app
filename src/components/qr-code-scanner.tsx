"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

const QRCODE_REGION_ID = "html5qr-code-full-region";

type Props = {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure: (error: string) => void;
};

export const QrCodeScanner = ({ onScanSuccess, onScanFailure }: Props) => {
  useEffect(() => {
    // スキャナインスタンスを作成
    const html5QrcodeScanner = new Html5QrcodeScanner(
      QRCODE_REGION_ID,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    // スキャンを実行
    html5QrcodeScanner.render(
      (decodedText: string) => {
        onScanSuccess(decodedText);
      },
      (error: string) => {
        onScanFailure(error);
      }
    );

    // コンポーネントがアンマウントされる時にスキャナをクリアする
    return () => {
      // ★★★ ここを修正 ★★★
      html5QrcodeScanner.clear().catch((error: unknown) => {
        console.error("Failed to clear html5QrcodeScanner.", error);
      });
      // ★★★ ここまで ★★★
    };
  }, [onScanSuccess, onScanFailure]);

  return <div id={QRCODE_REGION_ID} />;
};
