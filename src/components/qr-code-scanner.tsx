"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
// ★ 1. `InstanceType` を使うため、特別なインポートは不要。Html5QrcodeScannerのみでOK。
import { useEffect, useRef } from "react";

const QRCODE_REGION_ID = "html5qr-code-full-region";

type Props = {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure: (error: string) => void;
};

// ★ 2. これが最重要ポイント: `InstanceType` を使って型を正しく取得する
type Html5QrcodeScannerInstance = InstanceType<typeof Html5QrcodeScanner>;

export const QrCodeScanner = ({ onScanSuccess, onScanFailure }: Props) => {
  // ★ 3. useRefの型に、上で定義した正しいインスタンスの型を指定する
  const scannerRef = useRef<Html5QrcodeScannerInstance | null>(null);

  useEffect(() => {
    // 2回目実行のガード (変更なし)
    if (scannerRef.current) {
      return;
    }

    // 新しいスキャナインスタンスを作成 (変更なし)
    const scanner = new Html5QrcodeScanner(
      QRCODE_REGION_ID,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    // スキャンを実行 (変更なし)
    scanner.render(
      (decodedText: string) => onScanSuccess(decodedText),
      (error: string) => onScanFailure(error)
    );

    // 作成したインスタンスをrefに保存 (変更なし)
    scannerRef.current = scanner;

    // コンポーネントがアンマウントされる時のクリーンアップ処理
    return () => {
      if (scannerRef.current) {
        // `clear()`はPromiseを返すので`.catch()`で処理
        scannerRef.current.clear().catch((error: unknown) => { // ★ 4. errorの型を `unknown` に指定
          console.error("Failed to clear html5QrcodeScanner.", error);
        });
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={QRCODE_REGION_ID} />;
};