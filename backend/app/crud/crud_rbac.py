from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.role import Role, Permission
from app.schemas.role import RoleCreate, RoleUpdate, PermissionCreate, PermissionUpdate


class CRUDRole(CRUDBase[Role, RoleCreate, RoleUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Role | None:
        return db.query(self.model).filter(self.model.name == name).first()

    def assign_permissions(self, db: Session, *, db_obj: Role, permission_ids: list[int]) -> Role:
        permissions = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
        db_obj.permissions = permissions
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def revoke_permission(self, db: Session, *, db_obj: Role, permission_id: int) -> Role:
        db_obj.permissions = [p for p in db_obj.permissions if p.id != permission_id]
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


class CRUDPermission(CRUDBase[Permission, PermissionCreate, PermissionUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Permission | None:
        return db.query(self.model).filter(self.model.name == name).first()


role = CRUDRole(Role)
permission = CRUDPermission(Permission)
