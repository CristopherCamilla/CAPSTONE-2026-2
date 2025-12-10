import type { FastifyInstance } from 'fastify';
import { proyeccionVentasRepo } from '../../infra/proyeccionVentasRepo.js';
import { ProyeccionVentasTotalSchema } from '../schemas/proyeccion_ventas.schema.js';

export async function proyeccionVentasRoutes(app: FastifyInstance) {
    // Ruta GET para obtener todos los registros
    app.get('/api/proyeccion_ventas_total', async (req) => {
        try {
            const result = await proyeccionVentasRepo.list(); // Obtener todos los registros
            return result;
        } catch (error) {
            return { message: 'Error al obtener los registros', error };
        }
    });

    // Ruta GET para obtener un registro por ID
    app.get('/api/proyeccion_ventas_total/:id', async (req, reply) => {
        const id = Number((req.params as any).id);
        try {
            const result = await proyeccionVentasRepo.getById(id); // Obtener registro por ID
            if (!result) {
                return reply.code(404).send({ message: 'No encontrado' });
            }
            return result;
        } catch (error) {
            return { message: 'Error al obtener el registro', error };
        }
    });

    // Ruta POST para crear un nuevo registro
    app.post('/api/proyeccion_ventas_total', async (req, reply) => {
        const parsed = ProyeccionVentasTotalSchema.safeParse(req.body);  // Validación de los datos
        if (!parsed.success) {
            return reply.code(400).send(parsed.error.format()); // Enviar error si no es válido
        }
        try {
            const created = await proyeccionVentasRepo.create(parsed.data); // Crear el nuevo registro
            return reply.code(201).send(created); // Devolver el registro creado
        } catch (error) {
            return reply.code(500).send({ message: 'Error al crear el registro', error });
        }
    });

    // Ruta PUT para actualizar un registro por ID
    app.put('/api/proyeccion_ventas_total/:id', async (req, reply) => {
        const id = Number((req.params as any).id);
        const parsed = ProyeccionVentasTotalSchema.safeParse(req.body);  // Validación de los datos
        if (!parsed.success) {
            return reply.code(400).send(parsed.error.format()); // Enviar error si no es válido
        }
        try {
            const updated = await proyeccionVentasRepo.update(id, parsed.data); // Actualizar el registro
            if (!updated) {
                return reply.code(404).send({ message: 'No encontrado' });
            }
            return updated;
        } catch (error) {
            return reply.code(500).send({ message: 'Error al actualizar el registro', error });
        }
    });

    // Ruta DELETE para eliminar un registro por ID
    app.delete('/api/proyeccion_ventas_total/:id', async (req, reply) => {
        const id = Number((req.params as any).id);
        try {
            const removed = await proyeccionVentasRepo.remove(id); // Eliminar el registro
            if (!removed) {
                return reply.code(404).send({ message: 'No encontrado' });
            }
            return reply.code(204).send(); // Respuesta sin contenido si la eliminación es exitosa
        } catch (error) {
            return reply.code(500).send({ message: 'Error al eliminar el registro', error });
        }
    });
}
