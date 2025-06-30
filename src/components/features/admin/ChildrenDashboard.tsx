"use client";

import { addChild } from "@/actions/childrenActions"; // ★ サーバーアクションをインポート
import { QrCodeModal } from "@/components/qr-code-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormEvent, useState, useTransition } from "react";

type Child = { id: string; nickname: string; created_at: string };

type Props = {
  initialChildren: Child[];
};

export function ChildrenDashboard({ initialChildren }: Props) {
  // サーバーから渡された初期値でstateを初期化
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  // ★ useTransitionフックを使って、保留状態を管理
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setError(null);

    startTransition(async () => {
      const result = await addChild(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setNickname(""); // 成功したら入力欄をクリア
        // サーバー側でrevalidatePathが呼ばれるので、一覧は自動で更新される
        // 必要であれば、ここで手動でstateを更新することも可能
        if (result.data) {
          setChildren((prev) => [...prev, result.data as Child]);
        }
      }
    });
  };

  return (
    <>
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">新しい子供を追加</h3>
        <form onSubmit={handleSubmit} className="flex items-center gap-4">
          <Input
            type="text"
            name="nickname" // ★ name属性を追加
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="子供のニックネーム"
            className="flex-1"
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !nickname.trim()}>
            {isPending ? "追加中..." : "追加"}
          </Button>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">管理している子供の一覧</h3>
        <div className="space-y-3">
          {children.length > 0 ? (
            children.map((child) => (
              <div
                key={child.id}
                className="p-4 bg-gray-50 rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{child.nickname}</p>
                  <p className="text-sm text-gray-500">ID: {child.id}</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedChild(child)}
                >
                  QRコード表示
                </Button>
              </div>
            ))
          ) : (
            <div className="p-4 bg-gray-100 rounded-md text-center text-gray-500">
              <p>まだ子供が登録されていません。</p>
            </div>
          )}
        </div>
      </div>

      {selectedChild && (
        <QrCodeModal
          childId={selectedChild.id}
          childNickname={selectedChild.nickname}
          onClose={() => setSelectedChild(null)}
        />
      )}
    </>
  );
}
