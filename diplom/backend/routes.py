from flask import Blueprint, request, jsonify
from models import db, Task, GeneratedVariant, Work, WorkVariant
import json

bp = Blueprint('api', __name__)

# ====================== TASKS ======================
@bp.route('/tasks', methods=['GET', 'POST'])
def tasks():
    if request.method == 'POST':
        data = request.json
        print("📥 [POST /tasks] Получены данные:", data)  # ← Отладка

        try:
            # Обновляем существующую задачу или создаём новую
            task = Task.query.get(data['id'])
            if task is None:
                task = Task(id=data['id'])
                db.session.add(task)

            task.title = data.get('title', 'Без названия')
            task.description = data.get('description', '')
            task.variables = json.dumps(data.get('variables', []), ensure_ascii=False)
            task.canvasObjects = json.dumps(data.get('canvasObjects', []), ensure_ascii=False)
            task.operation = data.get('operation')        # НОВОЕ
            task.scalar = data.get('scalar')              # НОВОЕ

            db.session.commit()
            print(f"✅ Задача {task.id} успешно сохранена в БД")
            return jsonify({"id": task.id, "message": "Задача сохранена"}), 201
        except Exception as e:
            db.session.rollback()
            print("❌ Ошибка сохранения задачи:", str(e))
            return jsonify({"error": str(e)}), 500

    # GET all tasks
    tasks_list = Task.query.order_by(Task.created_at.desc()).all()
    return jsonify([{
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "variables": json.loads(t.variables) if t.variables else [],
        "canvasObjects": json.loads(t.canvasObjects) if t.canvasObjects else [],
        "operation": t.operation,        # НОВОЕ
        "scalar": t.scalar,              # НОВОЕ
        "createdAt": t.created_at.isoformat()
    } for t in tasks_list])


@bp.route('/tasks/<string:task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        task = Task.query.get_or_404(task_id)

        # Удаляем связанные варианты
        GeneratedVariant.query.filter_by(task_id=task_id).delete()

        db.session.delete(task)
        db.session.commit()

        print(f"✅ Задача {task_id} и её варианты успешно удалены")
        return jsonify({"message": "Задача успешно удалена"}), 200

    except Exception as e:
        print(f"❌ Ошибка при удалении задачи {task_id}:", str(e))
        return jsonify({"error": str(e)}), 500


# ====================== VARIANTS ======================
# ПРИМЕЧАНИЕ: варианты задач теперь временные и фронтендом больше не сохраняются.
# Эндпоинты оставлены для обратной совместимости, но не используются.
@bp.route('/tasks/<string:task_id>/variants', methods=['POST'])
def create_variants(task_id):
    data = request.json
    print(f"📥 [POST /tasks/{task_id}/variants] Получено {len(data.get('variants', []))} вариантов")

    variants_data = data.get('variants', [])
    new_variants = []

    for v in variants_data:
        picture_data = {
            "variables": v.get('variables', []),
            "canvasObjects": v.get('canvasObjects', [])
        }
        variant = GeneratedVariant(
            task_id=task_id,
            variant_number=v.get('variantNumber', 1),
            text=v.get('description', ''),
            picture=json.dumps(picture_data, ensure_ascii=False)
        )
        new_variants.append(variant)

    # Удаляем старые варианты этой задачи, чтобы оставались только свежие
    GeneratedVariant.query.filter_by(task_id=task_id).delete()

    db.session.add_all(new_variants)
    db.session.commit()
    print(f"✅ Сохранено {len(new_variants)} вариантов в БД")
    return jsonify({"message": f"Создано {len(new_variants)} вариантов"}), 201


@bp.route('/tasks/<string:task_id>/variants', methods=['GET'])
def get_variants(task_id):
    variants = GeneratedVariant.query.filter_by(task_id=task_id)\
        .order_by(GeneratedVariant.variant_number.asc()).all()

    result = []
    for v in variants:
        picture = json.loads(v.picture) if v.picture else {}
        result.append({
            "id": str(v.id),
            "taskId": v.task_id,
            "variantNumber": v.variant_number,
            "description": v.text,
            "variables": picture.get("variables", []),
            "canvasObjects": picture.get("canvasObjects", []),
            "createdAt": v.created_at.isoformat()
        })
    return jsonify(result)


# ====================== WORKS ======================
@bp.route('/works', methods=['GET', 'POST'])
def works():
    if request.method == 'POST':
        data = request.json
        try:
            work = Work(
                id=data['id'],
                name=data.get('name', 'Работа'),
                work_type=data.get('type', 'control'),
                task_ids=json.dumps(data.get('taskIds', []), ensure_ascii=False),
            )
            db.session.add(work)
            db.session.commit()
            print(f"✅ Работа {work.id} сохранена в БД")
            return jsonify({"id": work.id, "message": "Работа сохранена"}), 201
        except Exception as e:
            print("❌ Ошибка сохранения работы:", str(e))
            return jsonify({"error": str(e)}), 500

    works_list = Work.query.order_by(Work.created_at.asc()).all()
    return jsonify([{
        "id": w.id,
        "name": w.name,
        "type": w.work_type,
        "taskIds": json.loads(w.task_ids) if w.task_ids else [],
        "createdAt": w.created_at.isoformat()
    } for w in works_list])


@bp.route('/works/<string:work_id>', methods=['DELETE'])
def delete_work(work_id):
    try:
        work = Work.query.get_or_404(work_id)

        # Удаляем связанные варианты работы
        WorkVariant.query.filter_by(work_id=work_id).delete()

        db.session.delete(work)
        db.session.commit()
        print(f"✅ Работа {work_id} удалена")
        return jsonify({"message": "Работа успешно удалена"}), 200
    except Exception as e:
        print(f"❌ Ошибка при удалении работы {work_id}:", str(e))
        return jsonify({"error": str(e)}), 500


# ====================== WORK VARIANTS ======================
@bp.route('/works/<string:work_id>/variants', methods=['POST'])
def create_work_variants(work_id):
    data = request.json
    variants_data = data.get('variants', [])
    new_variants = []

    for v in variants_data:
        variant = WorkVariant(
            work_id=work_id,
            variant_number=v.get('variantNumber', 1),
            tasks=json.dumps(v.get('tasks', []), ensure_ascii=False)
        )
        new_variants.append(variant)

    # Заменяем старые варианты работы свежими
    WorkVariant.query.filter_by(work_id=work_id).delete()

    db.session.add_all(new_variants)
    db.session.commit()
    print(f"✅ Сохранено {len(new_variants)} вариантов работы {work_id}")
    return jsonify({"message": f"Создано {len(new_variants)} вариантов работы"}), 201


@bp.route('/works/<string:work_id>/variants', methods=['GET'])
def get_work_variants(work_id):
    variants = WorkVariant.query.filter_by(work_id=work_id)\
        .order_by(WorkVariant.variant_number.asc()).all()

    result = []
    for v in variants:
        result.append({
            "id": str(v.id),
            "workId": v.work_id,
            "variantNumber": v.variant_number,
            "tasks": json.loads(v.tasks) if v.tasks else [],
            "createdAt": v.created_at.isoformat()
        })
    return jsonify(result)


# ====================== HEALTH ======================
@bp.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})
