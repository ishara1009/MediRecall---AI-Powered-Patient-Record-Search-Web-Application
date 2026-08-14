const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/response');
const list = async (req,res)=>{try{const notifications=await Notification.find({recipient:req.user._id}).sort({createdAt:-1}).limit(50);const unread=await Notification.countDocuments({recipient:req.user._id,isRead:false});return sendSuccess(res,{notifications,unread},'Notifications retrieved successfully')}catch(error){return sendError(res,'Failed to retrieve notifications',500,error.message)}};
const read = async (req,res)=>{try{const item=await Notification.findOneAndUpdate({_id:req.params.id,recipient:req.user._id},{isRead:true},{new:true});if(!item)return sendError(res,'Notification not found',404);return sendSuccess(res,item,'Notification marked as read')}catch(error){return sendError(res,'Failed to update notification',500,error.message)}};
const readAll = async (req,res)=>{try{await Notification.updateMany({recipient:req.user._id,isRead:false},{isRead:true});return sendSuccess(res,null,'All notifications marked as read')}catch(error){return sendError(res,'Failed to update notifications',500,error.message)}};
module.exports={list,read,readAll};
