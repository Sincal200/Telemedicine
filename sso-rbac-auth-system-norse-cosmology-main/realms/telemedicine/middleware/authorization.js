// Middleware de autorización basado en roles
export function authorize(requiredRole) {
  return (req, res, next) => {
    try {
      const availableRoles = req.user?.realm_access?.roles || [];
      if (!availableRoles.includes(requiredRole)) throw new Error('access denied');
      next();
    } catch (err) {
      res.status(403).send({ error: 'access denied' });
    }
  };
}
