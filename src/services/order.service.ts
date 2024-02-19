import OrderModel from '../models/order.model';

//create new order

export const newOrder = async (data: any) => {
  const order = await OrderModel.create(data);
  return order;
};

//get all orders

export const getAllOrdersService = async () => {
  const orders = await OrderModel.find().sort({
    createdAt: -1, // latest order first
  });

  return orders;
};
