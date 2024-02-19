import OrderModel from '../models/order.model';

//create new order

export const newOrder = async (data: any) => {
  const order = await OrderModel.create(data);
  return order;
};
