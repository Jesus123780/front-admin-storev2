import Joi from 'joi'

export const productSchema = Joi.object({
  ProPrice: Joi.number().required(),
  ProDescuento: Joi.number().required(),
  ValueDelivery: Joi.number().required(),
  carProId: Joi.string().optional(),
  ProDescription: Joi.string().optional().min(0).max(180),
  ProWeight: Joi.string().optional(),
  names: Joi.string().required()
})