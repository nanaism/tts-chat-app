import { DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * `User`モデルに`id`プロパティを追加
   */
  interface User extends DefaultUser {
    id: string;
  }

  /**
   * セッションオブジェクトの`user`プロパティを、
   * `id`を含む拡張された`User`型で上書き
   */
  interface Session {
    user: User;
  }
}
