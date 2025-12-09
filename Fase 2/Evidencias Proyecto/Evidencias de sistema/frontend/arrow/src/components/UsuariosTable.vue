<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useUsuariosStore } from "@/stores/usuarios";

const store = useUsuariosStore();
const nombre = ref(""); const apellido = ref(""); const usuario = ref("");
const email = ref(""); const password = ref("");
const rol = ref<"admin"|"editor"|"usuario">("usuario");
const estado = ref<"activo"|"inactivo">("activo");

onMounted(() => store.fetch());
</script>

<template>
  <div>
    <h2>Usuarios</h2>

    <div style="margin-bottom: 12px;">
      <input v-model="store.search" placeholder="Buscar..." @input="store.fetch()" />
      <button @click="store.fetch()" :disabled="store.loading">Refrescar</button>
    </div>

    <table border="1" cellpadding="6">
      <thead>
      <tr>
        <th>Id</th><th>Nombre</th><th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th></th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="u in store.items" :key="u.id">
        <td>{{ u.id }}</td>
        <td>{{ u.nombre }} {{ u.apellido }}</td>
        <td>{{ u.usuario }}</td>
        <td>{{ u.email }}</td>
        <td>{{ u.rol }}</td>
        <td>{{ u.estado }}</td>
        <td><button @click="store.remove(u.id)">Eliminar</button></td>
      </tr>
      </tbody>
    </table>

    <p v-if="store.error" style="color:crimson">{{ store.error }}</p>

    <h3>Crear usuario</h3>
    <form @submit.prevent="store.create({ nombre, apellido, usuario, email, password, rol, estado })">
      <input v-model="nombre"   placeholder="Nombre"   required />
      <input v-model="apellido" placeholder="Apellido" required />
      <input v-model="usuario"  placeholder="Usuario"  required />
      <input v-model="email"    type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password (mín 6)" required />
      <select v-model="rol">
        <option value="usuario">usuario</option>
        <option value="editor">editor</option>
        <option value="admin">admin</option>
      </select>
      <select v-model="estado">
        <option value="activo">activo</option>
        <option value="inactivo">inactivo</option>
      </select>
      <button type="submit">Crear</button>
    </form>
  </div>
</template>
