from flask import Flask
from flask_cors import CORS
from sqlalchemy import text, inspect
from models import db
from routes import bp


def _migrate_tasks_columns():
    """Безопасно добавляет новые колонки operation и scalar в таблицу tasks,
    если их ещё нет. Существующие данные не теряются (SQLite ALTER TABLE ADD COLUMN).
    """
    inspector = inspect(db.engine)
    if 'tasks' not in inspector.get_table_names():
        return  # таблица будет создана через db.create_all()

    existing = {col['name'] for col in inspector.get_columns('tasks')}

    with db.engine.begin() as conn:
        if 'operation' not in existing:
            conn.execute(text('ALTER TABLE tasks ADD COLUMN operation VARCHAR(20)'))
            print("🔧 Добавлена колонка tasks.operation")
        if 'scalar' not in existing:
            conn.execute(text('ALTER TABLE tasks ADD COLUMN scalar FLOAT'))
            print("🔧 Добавлена колонка tasks.scalar")


def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    # === ИСПРАВИТЬ CORS ===
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    db.init_app(app)

    app.register_blueprint(bp, url_prefix='/api')   # ← Убедись, что url_prefix есть

    with app.app_context():
        db.create_all()
        # Миграция старой базы: добавляем колонки operation/scalar, если их нет
        _migrate_tasks_columns()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
