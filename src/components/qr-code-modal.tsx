"use client";

import { QRCodeSVG } from "qrcode.react";
import { Button } from "./ui/button";

type Props = {
  childId: string;
  childNickname: string;
  onClose: () => void;
};

export const QrCodeModal = ({ childId, childNickname, onClose }: Props) => {
  // QRコードに含めるURLを生成
  const loginUrl = `${window.location.origin}/login?child_id=${childId}`;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center"
      onClick={onClose} // 背景をクリックしたら閉じる
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-sm w-full text-center flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()} // モーダルの中身のクリックは閉じないようにする
      >
        <div className="space-y-2">
          <p className="text-gray-600">『{childNickname}』さん専用</p>
          <h3 className="text-2xl font-bold">ログイン用QRコード</h3>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-inner inline-block mx-auto">
          <QRCodeSVG value={loginUrl} size={256} />
        </div>
        <p className="text-sm text-gray-500">
          このQRコードを、お子様が使うスマホやタブレットのカメラで読み込んでください。
        </p>
        <Button onClick={onClose} variant="outline">
          閉じる
        </Button>
      </div>
    </div>
  );
};
