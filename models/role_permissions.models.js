import mongoose from "mongoose";

const { Schema } = mongoose;


const permissionSchema = new Schema({
  add: { type: Boolean, default: false },
  view: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false }
});


const roleSchema = new Schema({
  role: { type: String, required: true },
  permissions: {
  
    projects: { type: permissionSchema, default: {} },
    financial_management: { type: permissionSchema, default: {} },
    performance_tracking: { type: permissionSchema, default: {} }, 
   
    manage_users: { type: permissionSchema, default: {} },
    tickets:{ type: permissionSchema, default: {} }, 
    settings: { type: permissionSchema, default: {} }
  }
});

const rolePermissionSchema = new Schema(
  {
    role_permissions: { type: [roleSchema], default: [] } 
  },
  { timestamps: true }
);

export default mongoose.model("RolePermission", rolePermissionSchema);