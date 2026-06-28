from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# ==================== МОДЕЛИ ====================

class Teacher(db.Model):
    __tablename__ = 'teachers'
    id = db.Column(db.Integer, primary_key=True)
    name_surname = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    disciplines = db.relationship('Discipline', backref='author', lazy=True)


class Discipline(db.Model):
    __tablename__ = 'disciplines'
    id = db.Column(db.Integer, primary_key=True)
    name_discipline = db.Column(db.String(100), nullable=False)
    id_teacher = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=False)


class TaskType(db.Model):
    __tablename__ = 'task_types'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)  # ИДЗ, Контрольная и т.д.


class TaskTemplate(db.Model):
    __tablename__ = 'task_templates'
    id = db.Column(db.Integer, primary_key=True)
    id_discipline = db.Column(db.Integer, db.ForeignKey('disciplines.id'), nullable=False)
    text_template = db.Column(db.Text, nullable=False)
    picture_template = db.Column(db.Text)  # JSON с настройками координатной плоскости
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    elements = db.relationship('TemplateElement', backref='template', lazy=True)
    parameters = db.relationship('GenerationParameter', backref='template', lazy=True)


class Element(db.Model):
    __tablename__ = 'elements'
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(10), nullable=False)
    amount = db.Column(db.Integer, nullable=False)  # 4 для вектора, 2 для точки
    element_type = db.Column(db.String(20), nullable=False)  # vector, point, person, plane


class TemplateElement(db.Model):
    __tablename__ = 'template_elements'
    id = db.Column(db.Integer, primary_key=True)
    id_template = db.Column(db.Integer, db.ForeignKey('task_templates.id'), nullable=False)
    id_element = db.Column(db.Integer, db.ForeignKey('elements.id'), nullable=False)


class GenerationParameter(db.Model):
    __tablename__ = 'generation_parameters'
    id = db.Column(db.Integer, primary_key=True)
    id_template = db.Column(db.Integer, db.ForeignKey('task_templates.id'), nullable=False)
    name_variable = db.Column(db.String(20), nullable=False)
    lower_range = db.Column(db.Integer)
    upper_range = db.Column(db.Integer)
    initial_value = db.Column(db.Integer)


class GeneratedVariant(db.Model):
    __tablename__ = 'generated_variants'
    id = db.Column(db.Integer, primary_key=True)
    
    # Связь с задачей (главное изменение)
    task_id = db.Column(db.String(50), db.ForeignKey('tasks.id'), nullable=False)
    
    variant_number = db.Column(db.Integer, nullable=False)
    text = db.Column(db.Text, nullable=False)
    picture = db.Column(db.Text)           # JSON с variables + canvasObjects
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    task = db.relationship('Task', backref='variants', lazy=True)


class TemplateGeneration(db.Model):
    __tablename__ = 'template_generations'
    id = db.Column(db.Integer, primary_key=True)
    id_template = db.Column(db.Integer, db.ForeignKey('task_templates.id'), nullable=False)
    number_options = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.String(50), primary_key=True)  # используем строковый id из фронта
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    variables = db.Column(db.Text)           # JSON
    canvasObjects = db.Column(db.Text)       # JSON
    operation = db.Column(db.String(20))     # выбранная векторная операция (add/subtract/scalar/length/dot)
    scalar = db.Column(db.Float)             # число для операции "умножение на скаляр"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Work(db.Model):
    __tablename__ = 'works'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    work_type = db.Column(db.String(20), nullable=False)  # 'control' | 'independent'
    task_ids = db.Column(db.Text)  # JSON-массив id задач
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class WorkVariant(db.Model):
    __tablename__ = 'work_variants'
    id = db.Column(db.Integer, primary_key=True)
    work_id = db.Column(db.String(50), nullable=False)  # id родительской работы
    variant_number = db.Column(db.Integer, nullable=False)
    tasks = db.Column(db.Text)  # JSON: задачи с рандомизированными координатами
    created_at = db.Column(db.DateTime, default=datetime.utcnow)