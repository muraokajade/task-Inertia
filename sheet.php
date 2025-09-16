<?php

// A) 短縮矢印関数（1式・暗黙return・外側自動キャプチャ）
$add = fn (int $a, int $b) : int => $a + $b;

// B) 従来のクロージャ（複数行・明示return・外側は use で捕まえる）
$rate = 1.1;
$calc = function (int $n) use ($rate) : int {
    $x = $n * $rate;
    return (int) round($x);
};

// C) 型付き & 戻り型付き
$toStr = fn (int $id) : string => (string) $id;

// D) コレクションでの多用パターン
$arr   = [1,2,3];
$twice = array_map(fn ($x) => $x * 2, $arr); // [2,4,6]

// E) Laravelのwhereクロージャ
$query->where(function ($q) use ($uid) {
    $q->where('creator_id', $uid)->whereNull('deleted_at');
});

// F) Inertia share の lazy 評価
//'some' => fn () => expensiveComputation(),
