<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model {
  use SoftDeletes;
  protected $fillable = [
    'project_id','creator_id','assignee_id','parent_id',
    'title','description','status','priority',
    'start_date','due_date','completed_at','position','labels'
  ];
  protected $casts = ['labels'=>'array','start_date'=>'date','due_date'=>'date','completed_at'=>'datetime'];
}
