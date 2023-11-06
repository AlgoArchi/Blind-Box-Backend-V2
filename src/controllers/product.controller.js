const log = require('debug')('app:controllers:product');
const { Product } = require('~/models');
const { sendError } = require('~/utils/utils');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    return res.status(200).json({ success: true, products });
  } catch (err) {
    log(err);
    return sendError(req, res, 500, 'Server Error');
  }
};

exports.addProduct = async (req, res) => {
  const {
    name,
    metadata_url,
    enabled,
    image_link,
    product_description,
    collection_id,
    product_category_id,
    tags,
    featured,
    featured_rule,
    featured_duration,
  } = req.body;
  let tagList = tags.split(',');
  tagList = tagList.map((item) => item.trim());

  try {
    await Product.create({
      name,
      metadata_url,
      enabled: enabled === 'true',
      image_link,
      product_description,
      collection_id: Number(collection_id),
      product_category_id: Number(product_category_id),
      tags: tagList,
      featured: featured === 'true',
      featured_rule,
      featured_duration,
    });

    const products = await Product.findAll();
    return res.status(200).json({ success: true, products });
  } catch (err) {
    log(err);
    return sendError(req, res, 500, 'Invalid Product Data');
  }
};

exports.updateProduct = async (req, res) => {
  const {
    id,
    name,
    metadata_url,
    enabled,
    image_link,
    product_description,
    collection_id,
    product_category_id,
    tags,
    featured,
    featured_rule,
    featured_duration,
  } = req.body;
  let tagList = tags.split(',');
  tagList = tagList.map((item) => item.trim());
  try {
    await Product.upsert({
      id,
      name,
      metadata_url,
      enabled: enabled === 'true',
      image_link,
      product_description,
      collection_id: Number(collection_id),
      product_category_id: Number(product_category_id),
      tags: tagList,
      featured: featured === 'true',
      featured_rule,
      featured_duration,
    });
    const products = await Product.findAll();
    return res.status(200).json({ success: true, products });
  } catch (err) {
    log(err);
    return sendError(req, res, 500, 'Invalid Product Data');
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.body;
  try {
    await Product.destroy({ where: { id } });
    const products = await Product.findAll();
    return res.status(200).json({ success: true, products });
  } catch (err) {
    log(err);
    return sendError(req, res, 500, 'Invalid Product ID');
  }
};
