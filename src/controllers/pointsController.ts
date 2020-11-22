import { Request, Response } from "express";
import knex from "../database/conection";

export default class PointsController {
  async index(request: Request, response: Response) {
    const { city, uf, items } = request.query;
    const parseItems = String(items)
      .split(",")
      .map((item) => Number(item.trim()));

    const points = await knex("points")
      .join("point_items", "points.id", "=", "point_items.point_id")
      .whereIn("point_items.item_id", parseItems)
      .where("points.city", String(city))
      .where("points.uf", String(uf))
      .distinct()
      .select("points.*");

    return response.json(points);
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await knex("points").where("id", id).first();
    const items = await knex("items")
      .join("point_items", "items.id", "=", "point_items.item_id")
      .where("point_items.point_id", id)
      .select("items.title");

    if (!point) {
      return response.status(404).json({ message: "point not found " });
    } else {
      return response.json({ ...point, items });
    }
  }

  async create(request: Request, response: Response) {
    const {
      name,
      emai,
      whatpp,
      latitude,
      longitude,
      number,
      city,
      uf,
      items,
    } = request.body;

    const trx = await knex.transaction();

    const point = {
      image:
        "https://images.unsplash.com/photo-1556767576-5ec41e3239ea?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60",
      name,
      emai,
      whatpp,
      latitude,
      longitude,
      number,
      city,
      uf,
    };

    const insertIds = await trx("points").insert(point);

    const point_id = insertIds[0];
    const pointsItems = items.map((item_id: number) => {
      return { item_id, point_id };
    });

    await trx("point_items").insert(pointsItems);
    await trx.commit();

    return response.json({ point_id, ...point });
  }
}
