from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.role import Role, Permission
from app.schemas.role import RoleCreate, RoleUpdate, PermissionCreate, PermissionUpdate


class CRUDRole(CRUDBase[Role, RoleCreate, RoleUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Role | None:
        return db.query(self.model).filter(self.model.name == name).first()

    def create(self, db: Session, *, obj_in: RoleCreate) -> Role:
        db_obj = self.model(
            name=obj_in.name,
            description=obj_in.description
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Role, obj_in: RoleUpdate) -> Role:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        
        # Don't allow updating name via update method to prevent breaking consistency
        if "name" in update_data:
            del update_data["name"]
            
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def assign_permissions(self, db: Session, *, db_obj: Role, permission_ids: list[int]) -> Role:
        # Fetch all permission objects and assign to role
        permissions = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
        db_obj.permissions = list(set(db_obj.permissions + permissions))
        
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
