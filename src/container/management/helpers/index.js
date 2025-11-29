/**
 * Generate a permissions category with a specified name, description, and permissions.
 * @param {string} name - The name of the category.
 * @param {string} description - The description of the category.
 * @param {Array<string>} actions - The list of actions for the permissions (e.g., 'create', 'read').
 * @param {string} subject - The subject for the permissions (e.g., 'products').
 * @returns {Object} A category object with permissions.
 */
const createPermissionCategory = (name, description, actions, subject) => {
  return {
    category: {
      name,
      description,
      permissions: actions.map(action => {return {
        action,
        subject
      }})
    }
  }
}

/**
 * Generate a list of permission categories based on a configuration array.
 * @param {Array<Object>} categoriesConfig - Array of configurations with name, description, subject, and actions.
 * @returns {Array<Object>} List of permission categories.
 */
const generatePermissions = (categoriesConfig) => {
  return categoriesConfig.map(({ name, actions = ['create', 'read', 'update', 'delete'], ...rest }) => 
  {
    const { subject } = rest.category ?? null
    const description = rest.category?.name ? `Aqui puedes gestionar los permisos que va tener el usuario en el modulo ${rest.category?.name}, ` : ''
    return createPermissionCategory(name, description, actions, subject)
  }
  )
}

export const description = [
  {
    category: {
      name: 'Dashboard',
      subject: 'dashboard'
    }
  },
  {
    category: {
      name: 'Ventas',
      subject: 'sales'
    }
  },
  {
    category: {
      name: 'Empleados',
      subject: 'employees'
    }
  }, 
  {
    category: {
      name: 'Compras',
      subject: 'buys'
    }
  },
  {
    category: {
      name: 'Agenda',
      subject: 'schedules'
    }
  },
  {
    category: {
      name: 'Roles',
      subject: 'roles'
    }
  },
  {
    category: {
      name: 'Clientes',
      subject: 'clients'
    }
  },
  {
    category: {
      name: 'Productos',
      subject: 'products'
    }
  },
  {
    category: {
      name: 'Categorías',
      subject: 'categories'
    }
  },
  {
    category: {
      name: 'Reportes',
      subject: 'reports'
    }
  },
  {
    category: {
      name: 'Configuración',
      subject: 'settings'
    }
  },
  {
    category: {
      name: 'Usuarios',
      subject: 'users'
    }
  },
  {
    category: {
      name: 'Pedidos',
      subject: 'orders'
    }
  }
]

export const permissions = generatePermissions(description)
