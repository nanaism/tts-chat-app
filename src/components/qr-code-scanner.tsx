"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import type { Html5QrcodeError } from "html5-qrcode/esm/core";
import { useEffect, useRef } from "react";

const QRCODE_REGION_ID = "html5qr-code-full-region";

type Props = {
  onScanSuccess: (decodedText: string) => void;
  // ライブラリが返すエラーはオブジェクトの場合があるため、型をunknownにして柔軟に受け取る
  onScanFailure: (error: unknown) => void;
};

type Html5QrcodeScannerInstance = InstanceType<typeof Html5QrcodeScanner>;

export const QrCodeScanner = ({ onScanSuccess, onScanFailure }: Props) => {
  const scannerRef = useRef<Html5QrcodeScannerInstance | null>(null);

  useEffect(() => {
    if (scannerRef.current) {
      return;
    }

    const scanner = new Html5QrcodeScanner(
      QRCODE_REGION_ID,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false // verbose
    );

    // ライブラリの仕様に合わせ、成功時と失敗時のコールバックを正しく設定
    const successCallback = (decodedText: string) => {
      onScanSuccess(decodedText);
    };

    const errorCallback = (error: Html5QrcodeError) => {
      // ライブラリからのエラーオブジェクトをそのままコールバックに渡す
      onScanFailure(error);
    };

    scanner.render(successCallback, errorCallback);

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error: unknown) => {
          console.error("Failed to clear html5QrcodeScanner.", error);
        });
        scannerRef.current = null;
      }
    };
    // onScanSuccessとonScanFailureはpropsなので依存配列に含めるのが望ましい
  }, [onScanSuccess, onScanFailure]);

  return <div id={QRCODE_REGION_ID} />;
};
