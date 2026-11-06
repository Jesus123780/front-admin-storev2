import Joi from 'joi'

export const productSchema = Joi.object({
  ProPrice: Joi.number().required(),
  ProDescuento: Joi.number().required(),
  ValueDelivery: Joi.number().required(),
  carProId: Joi.string().optional(),
  ProDescription: Joi.string().optional().min(0).max(180),
  ProWeight: Joi.string().optional(),
  // Optional barcode typed in the form. Allowed so validation doesn't fail on
  // this unknown key (Joi rejects unknown keys by default), which kept the
  // "Crear producto" button disabled as soon as a barcode was entered.
  ProBarCode: Joi.string().allow(null, '').optional(),
  names: Joi.string().required()
})