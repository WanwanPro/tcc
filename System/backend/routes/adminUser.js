const express = require('express');
const { User, Role } = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// 获取所有角色
router.get('/roles', auth, async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 创建角色
router.post('/roles', auth, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    // 验证输入
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '角色名称不能为空'
      });
    }
    
    // 检查角色名称是否已存在
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: '角色名称已存在'
      });
    }
    
    // 创建新角色
    const role = new Role({
      name,
      description,
      permissions: permissions || []
    });
    
    await role.save();
    
    res.status(201).json({
      success: true,
      message: '角色创建成功',
      data: role
    });
  } catch (error) {
    console.error('创建角色错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新角色
router.put('/roles/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    
    // 验证输入
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '角色名称不能为空'
      });
    }
    
    // 检查角色是否存在
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: '角色不存在'
      });
    }
    
    // 检查角色名称是否已被其他角色使用
    if (name !== role.name) {
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: '角色名称已存在'
        });
      }
    }
    
    // 更新角色
    role.name = name;
    role.description = description;
    role.permissions = permissions || [];
    
    await role.save();
    
    res.json({
      success: true,
      message: '角色更新成功',
      data: role
    });
  } catch (error) {
    console.error('更新角色错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除角色
router.delete('/roles/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查角色是否存在
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: '角色不存在'
      });
    }
    
    // 检查是否有用户使用此角色
    const usersWithRole = await User.countDocuments({ role: id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `有 ${usersWithRole} 个用户正在使用此角色，无法删除`
      });
    }
    
    // 删除角色
    await Role.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: '角色删除成功'
    });
  } catch (error) {
    console.error('删除角色错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取所有用户
router.get('/users', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '', status = '', role = '' } = req.query;
    
    // 构建查询条件
    const query = {};
    
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (role) {
      query.role = role;
    }
    
    // 计算分页
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // 查询用户
    const users = await User.find(query)
      .populate('role', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    // 获取总数
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: pageNum,
          pageSize: limitNum,
          total
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取单个用户
router.get('/users/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).populate('role');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 创建用户
router.post('/users', auth, async (req, res) => {
  try {
    const { username, password, email, name, phone, role, avatar = '' } = req.body;
    
    // 验证输入
    if (!username || !password || !email || !name || !role) {
      return res.status(400).json({
        success: false,
        message: '用户名、密码、邮箱、姓名和角色不能为空'
      });
    }
    
    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已存在'
      });
    }
    
    // 检查角色是否存在
    const roleExists = await Role.findById(role);
    if (!roleExists) {
      return res.status(400).json({
        success: false,
        message: '角色不存在'
      });
    }
    
    // 创建新用户
    const user = new User({
      username,
      password,
      email,
      name,
      phone,
      role,
      avatar
    });
    
    await user.save();
    
    // 查询创建的用户，包含角色信息
    const createdUser = await User.findById(user._id).populate('role');
    
    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: createdUser
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新用户
router.put('/users/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, name, phone, role, avatar, status } = req.body;
    
    // 查找用户
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查用户名是否已被其他用户使用
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }
    }
    
    // 检查邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已存在'
        });
      }
    }
    
    // 检查角色是否存在
    if (role) {
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: '角色不存在'
        });
      }
    }
    
    // 更新用户信息
    if (username) user.username = username;
    if (email) user.email = email;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (avatar !== undefined) user.avatar = avatar;
    if (status) user.status = status;
    
    await user.save();
    
    // 查询更新后的用户，包含角色信息
    const updatedUser = await User.findById(user._id).populate('role');
    
    res.json({
      success: true,
      message: '用户更新成功',
      data: updatedUser
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 重置用户密码
router.put('/users/:id/password', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    // 验证输入
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: '新密码不能为空'
      });
    }
    
    // 查找用户
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 锁定/解锁用户
router.put('/users/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 验证输入
    if (!status || !['active', 'inactive', 'locked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }
    
    // 查找用户
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 更新用户状态
    user.status = status;
    
    // 如果是解锁，清除锁定信息
    if (status === 'active') {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: `用户${status === 'active' ? '解锁' : '锁定'}成功`,
      data: {
        id: user._id,
        status: user.status
      }
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除用户
router.delete('/users/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查是否尝试删除自己
    if (req.user && req.user._id && id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }
    
    // 查找用户
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 删除用户
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
