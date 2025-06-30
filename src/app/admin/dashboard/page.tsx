"use client";

import { QrCodeModal } from "@/components/qr-code-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";

type Child = { id: string; nickname: string; created_at: string };

export default function DashboardPage() {
  // sessionの利用を復活させ、statusと一緒に取得
  const { data: session, status } = useSession();

  const [children, setChildren] = useState<Child[]>([]);
  const [isChildrenLoading, setIsChildrenLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  useEffect(() => {
    // 認証されていなければサインインページにリダイレクト
    if (status === "unauthenticated") {
      signIn("google");
    }
    // 認証されていたら子供のデータを取得
    if (status === "authenticated") {
      const fetchChildren = async () => {
        setIsChildrenLoading(true);
        try {
          const response = await fetch("/api/children", {
            cache: "no-store",
            credentials: "include",
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `データの取得に失敗しました: ${response.status} ${errorText}`
            );
          }
          const data: Child[] = await response.json();
          setChildren(data);
        } catch (err: unknown) {
          // ★ anyをunknownに
          const message =
            err instanceof Error ? err.message : "不明なエラーが発生しました。";
          setError(message);
          console.error(err);
        } finally {
          setIsChildrenLoading(false);
        }
      };
      fetchChildren();
    }
  }, [status]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add child");
      }
      const newChild = await response.json();
      setChildren((prev) => [...prev, newChild]);
      setNickname("");
    } catch (err: unknown) {
      // ★ anyをunknownに
      const message =
        err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 認証状態が決まるまでローディング表示
  if (status !== "authenticated") {
    return (
      <div className="p-6 text-center">
        <p>認証情報を確認中...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          {/* ★ sessionを正しく利用 */}
          <h2 className="text-2xl font-semibold">
            ようこそ、{session?.user?.name}さん
          </h2>
          <p className="text-gray-600">管理する子供を追加・確認できます。</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">新しい子供を追加</h3>
          {/* ★ formにhandleSubmitを接続 */}
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <Input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="子供のニックネーム"
              className="flex-1"
              disabled={isSubmitting}
            />
            {/* ★ isSubmittingを利用 */}
            <Button type="submit" disabled={isSubmitting || !nickname.trim()}>
              {isSubmitting ? "追加中..." : "追加"}
            </Button>
          </form>
          {/* ★ errorを利用 */}
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">管理している子供の一覧</h3>
          <div className="space-y-3">
            {isChildrenLoading ? (
              <div className="p-4 text-center text-gray-500">
                子供のリストを読み込んでいます...
              </div>
            ) : children.length > 0 ? (
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
