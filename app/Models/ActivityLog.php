<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

use function request;

class ActivityLog extends Model
{
    /**
     * 変更・操作の監査ログを保持するモデル
     *
     * 主な用途:
     * - だれ(user_id)が・いつ・どのエンティティ(entity_type/entity_id)に
     *   どんな操作(action)を行い、値がどう変わったか（before/after）を記録
     * - 運用レビュー/障害調査/コンプライアンス対応の土台
     *
     * テーブル構造（migration参照）:
     * - user_id: 実行者（匿名操作を想定して nullable）
     * - action: "task.created" / "task.updated" / "task.deleted" / "task.reordered" など
     * - entity_type: "task" など（モデル名やテーブル名ベース）
     * - entity_id: 対象ID
     * - before/after: 変更前後のスナップショット（JSON = arrayにキャスト）
     * - meta: 付加情報（例: 一括操作の id 配列, 件数, リクエストID等）
     * - ip/ua: リモート情報（監査強化/異常検知に有用）
     */

    /**
     * 一括代入許可カラム
     * NOTE: 不要カラムは慎重に（監査系は原則、明示的にallow）
     */
    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'before',
        'after',
        'meta',
        'ip',
        'ua',
    ];

    /**
     * JSON→配列の自動キャスト設定
     */
    protected $casts = [
        'before' => 'array',
        'after'  => 'array',
        'meta'   => 'array',
    ];

    /**
     * 監査ログを1行記録するユーティリティ
     *
     * @param  string         $action   例: 'task.updated', 'task.deleted'
     * @param  ?Model         $entity   対象モデル（nullable: 一括操作や汎用イベントで無しもOK）
     * @param  array|null     $before   変更前スナップショット（必要なキーだけに絞ると軽量）
     * @param  array|null     $after    変更後スナップショット
     * @param  array          $meta     付加情報（ids, count, request_id など）
     * @return void
     */

    public static function record(string $action, ?Model $entity = null, ?array $before = null, ?array $after = null, array $meta = []) : void
    {
        $entityType = null;
        $entityId   = null;

        if ($entity) {
            $table    = $entity->getTable();
            $entityId = $entity->getKey();
        }
        static::create([
            'user_id'     => Auth::id(),                 // 実行者（非ログインならnull）
            'action'      => $action,                      // 動作種別
            'entity_type' => $entityType,                  // エンティティ種別
            'entity_id'   => $entityId,                    // 対象ID
            'before'      => $before ?: null,              // 空配列はnullへ（省サイズ）
            'after'       => $after ?: null,
            'meta'        => $meta ?: null,
            'ip'          => request()->ip(),              // 送信元IP
            'ua'          => request()->userAgent(),       // User-Agent
        ]);
    }
}
