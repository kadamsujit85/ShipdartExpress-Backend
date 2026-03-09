const express = require('express');
const router = express.Router();
const roleService = require('../../services/UserAccess/role.js');

router
    .post('/get', roleService.get)
    .post('/create', roleService.validate(), roleService.create)
    .put('/update', roleService.validate(), roleService.update)
    .post('/getChildRoles', roleService.getChildRoles)
    .post('/getRoleEmpwise', roleService.getRoleEmpwise)


module.exports = router;