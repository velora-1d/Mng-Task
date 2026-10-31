<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Avatar from '#lib/components/ui/Avatar.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import Card from '#lib/components/ui/Card.svelte';
	import Chip from '#lib/components/ui/Chip.svelte';
	import Dialog from '#lib/components/ui/Dialog.svelte';
	import EmptyState from '#lib/components/ui/EmptyState.svelte';
	import Icon from '#lib/components/ui/Icon.svelte';
	import Input from '#lib/components/ui/Input.svelte';
	import Pagination from '#lib/components/ui/Pagination.svelte';
	import Select from '#lib/components/ui/Select.svelte';
	import { formatDateTime } from '#lib/utils/date';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let createOpen = $state(false);
	let editOpen = $state(false);
	let resetOpen = $state(false);

	let selectedUser = $state<any>(null);

	// Form values
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let role = $state('USER');

	let newPassword = $state('');

	function openEdit(u: any) {
		selectedUser = u;
		name = u.name;
		email = u.email;
		role = u.role;
		editOpen = true;
	}

	function openReset(u: any) {
		selectedUser = u;
		newPassword = '';
		resetOpen = true;
	}

	function hrefForPage(target: number): string {
		const params = new URLSearchParams(page.url.searchParams.toString());
		params.set('page', String(target));
		return `?${params.toString()}`;
	}

	const roleOptions = [
		{ value: 'USER', label: 'User (Anggota)' },
		{ value: 'OWNER', label: 'Owner (Admin)' }
	];
</script>

<svelte:head>
	<title>Kelola Pengguna — Mng-Task</title>
</svelte:head>

<div class="page-head">
	<div>
		<p class="overline">Akses & Tim</p>
		<h1 class="page-title">Pengguna</h1>
		<p class="page-sub">Kelola akun anggota tim dan hak akses mereka.</p>
	</div>
	<div class="flex gap-2">
		<Button
			variant="primary"
			onclick={() => {
				name = '';
				email = '';
				password = '';
				role = 'USER';
				createOpen = true;
			}}
		>
			<Icon name="plus" size={16} />
			Tambah pengguna
		</Button>
	</div>
</div>

{#if form?.error}
	<div
		class="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-[var(--error-soft)] px-3 py-2.5 text-xs text-danger"
		role="alert"
	>
		<Icon name="alert" size={15} class="mt-0.5 shrink-0" />
		<span>{form.error}</span>
	</div>
{/if}

<!-- Filter Pengguna -->
<form method="GET" class="mb-4 rounded-xl border border-border-base bg-surface p-3" aria-label="Filter pengguna">
	<div class="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
		<label class="flex h-10 items-center gap-2 rounded-lg border border-border-base bg-canvas px-3">
			<Icon name="search" size={16} class="text-ink-muted" />
			<span class="sr-only">Cari pengguna</span>
			<input
				type="search"
				name="q"
				value={data.filters.q}
				placeholder="Cari nama atau email..."
				class="h-full flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
			/>
		</label>

		<select
			name="role"
			class="input"
			aria-label="Filter role"
			onchange={(e) => e.currentTarget.form?.requestSubmit()}
		>
			<option value="">Semua role</option>
			<option value="OWNER" selected={data.filters.role === 'OWNER'}>Owner</option>
			<option value="USER" selected={data.filters.role === 'USER'}>User</option>
		</select>

		<select
			name="status"
			class="input"
			aria-label="Filter status"
			onchange={(e) => e.currentTarget.form?.requestSubmit()}
		>
			<option value="">Semua status</option>
			<option value="active" selected={data.filters.status === 'active'}>Aktif</option>
			<option value="inactive" selected={data.filters.status === 'inactive'}>Nonaktif</option>
		</select>

		<button type="submit" class="btn btn-secondary">Terapkan</button>
	</div>
</form>

<div class="surface-card overflow-hidden">
	{#if data.items.length === 0}
		<EmptyState
			icon="users"
			title="Tidak ada pengguna ditemukan"
			description="Coba ganti kata kunci pencarian atau filter status."
		/>
	{:else}
		<div class="overflow-x-auto">
			<table class="data-table">
				<thead>
					<tr>
						<th>Pengguna</th>
						<th>Role</th>
						<th>Status</th>
						<th>Terakhir Aktif</th>
						<th>Dibuat</th>
						<th class="text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as u (u.id)}
						<tr>
							<td>
								<div class="flex items-center gap-2.5">
									<Avatar name={u.name} size="md" />
									<div class="min-w-0">
										<p class="font-semibold text-ink">{u.name}</p>
										<p class="text-xs text-ink-muted">{u.email}</p>
									</div>
								</div>
							</td>
							<td>
								<Chip tone={u.role === 'OWNER' ? 'urgent' : 'neutral'}>
									{u.role === 'OWNER' ? 'Owner' : 'User'}
								</Chip>
							</td>
							<td>
								<Chip tone={u.isActive ? 'done' : 'blocked'}>
									{u.isActive ? 'Aktif' : 'Nonaktif'}
								</Chip>
							</td>
							<td class="text-xs text-ink-muted">
								{u.lastSeenAt ? formatDateTime(u.lastSeenAt) : 'Belum pernah'}
							</td>
							<td class="text-xs text-ink-muted">
								{formatDateTime(u.createdAt)}
							</td>
							<td class="text-right">
								<div class="flex items-center justify-end gap-1">
									<button
										type="button"
										class="grid size-8 place-items-center rounded text-ink-muted hover:bg-surface-raised hover:text-ink"
										title="Ubah info pengguna"
										onclick={() => openEdit(u)}
									>
										<Icon name="edit" size={15} />
									</button>
									<button
										type="button"
										class="grid size-8 place-items-center rounded text-ink-muted hover:bg-surface-raised hover:text-ink"
										title="Reset kata sandi"
										onclick={() => openReset(u)}
									>
										<Icon name="shield" size={15} />
									</button>

									<form method="POST" action="?/toggleActive" use:enhance class="inline-block">
										<input type="hidden" name="id" value={u.id} />
										<input type="hidden" name="active" value={u.isActive ? 'false' : 'true'} />
										<button
											type="submit"
											class="btn btn-ghost btn-sm text-xs {u.isActive ? 'hover:text-danger' : 'text-success'}"
											title={u.isActive ? 'Nonaktifkan akun' : 'Aktifkan akun'}
										>
											{u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
										</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<Pagination
			page={data.page}
			totalPages={data.totalPages}
			total={data.total}
			hrefFor={hrefForPage}
		/>
	{/if}
</div>

<!-- Modal Tambah Pengguna -->
<Dialog
	bind:open={createOpen}
	title="Tambah Pengguna Baru"
	description="Akun baru akan diminta mengganti password pada login pertama."
>
	<form
		method="POST"
		action="?/create"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'redirect' || result.type === 'success') {
					createOpen = false;
				}
			};
		}}
		class="stack"
	>
		<Input label="Nama lengkap" name="name" required bind:value={name} placeholder="Nama staf / anggota" />
		<Input
			label="Email"
			name="email"
			type="email"
			required
			bind:value={email}
			placeholder="staf@perusahaan.test"
		/>
		<Input
			label="Password awal"
			name="password"
			type="password"
			required
			minlength={8}
			bind:value={password}
			hint="Minimal 8 karakter."
			placeholder="••••••••"
		/>
		<Select label="Role" name="role" options={roleOptions} bind:value={role} />

		<div class="mt-4 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (createOpen = false)}>Batal</Button>
			<Button type="submit">Tambah pengguna</Button>
		</div>
	</form>
</Dialog>

<!-- Modal Edit Pengguna -->
<Dialog
	bind:open={editOpen}
	title="Ubah Data Pengguna"
	description="Perbarui informasi profil dan hak akses."
>
	<form
		method="POST"
		action="?/update"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'redirect' || result.type === 'success') {
					editOpen = false;
				}
			};
		}}
		class="stack"
	>
		<input type="hidden" name="id" value={selectedUser?.id} />
		<Input label="Nama lengkap" name="name" required bind:value={name} />
		<Input label="Email" name="email" type="email" required bind:value={email} />
		<Select label="Role" name="role" options={roleOptions} bind:value={role} />

		<div class="mt-4 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (editOpen = false)}>Batal</Button>
			<Button type="submit">Simpan perubahan</Button>
		</div>
	</form>
</Dialog>

<!-- Modal Reset Password -->
<Dialog
	bind:open={resetOpen}
	title="Reset Kata Sandi"
	description={`Setel ulang password untuk ${selectedUser?.name}.`}
>
	<form
		method="POST"
		action="?/resetPassword"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'redirect' || result.type === 'success') {
					resetOpen = false;
				}
			};
		}}
		class="stack"
	>
		<input type="hidden" name="id" value={selectedUser?.id} />
		<Input
			label="Password baru"
			name="newPassword"
			type="password"
			required
			minlength={8}
			bind:value={newPassword}
			hint="Minimal 8 karakter. Sesi pengguna akan langsung dicabut."
			placeholder="••••••••"
		/>

		<div class="mt-4 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (resetOpen = false)}>Batal</Button>
			<Button type="submit">Reset password</Button>
		</div>
	</form>
</Dialog>
