<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
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
	import ConfirmDialog from '#lib/components/ui/ConfirmDialog.svelte';
	import Select from '#lib/components/ui/Select.svelte';
	import { formatDateTime } from '#lib/utils/date';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let createOpen = $state(false);
	let editOpen = $state(false);
	let resetOpen = $state(false);
	let detailOpen = $state(false);

	let selectedUser = $state<any>(null);
	let userToDeactivate = $state<any>(null);
	let deactivateDialogOpen = $state(false);
	let bulkDeactivateOpen = $state(false);
	let deactivating = $state(false);

	// Form values
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let role = $state('USER');

	let newPassword = $state('');

	let selectedIds = $state<string[]>([]);
	let bulkBusy = $state(false);

	$effect(() => {
		data.items;
		selectedIds = [];
	});

	const allSelected = $derived(data.items.length > 0 && selectedIds.length === data.items.length);
	const someSelected = $derived(selectedIds.length > 0 && selectedIds.length < data.items.length);

	function toggleAll() {
		if (allSelected) {
			selectedIds = [];
		} else {
			selectedIds = data.items.map((u) => u.id);
		}
	}

	function toggleOne(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((item) => item !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

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
						<th class="w-10 text-center">
							<input
								type="checkbox"
								checked={allSelected}
								indeterminate={someSelected}
								onchange={toggleAll}
								class="size-4 cursor-pointer rounded border-border-strong text-primary focus:ring-primary"
								aria-label="Pilih semua pengguna"
							/>
						</th>
						<th class="w-12 text-center">No</th>
						<th>Pengguna</th>
						<th>Role</th>
						<th>Status</th>
						<th>Terakhir Aktif</th>
						<th>Dibuat</th>
						<th class="text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as u, index (u.id)}
						<tr class={selectedIds.includes(u.id) ? 'bg-primary-soft/40' : ''}>
							<td class="text-center">
								<input
									type="checkbox"
									checked={selectedIds.includes(u.id)}
									onchange={() => toggleOne(u.id)}
									class="size-4 cursor-pointer rounded border-border-strong text-primary focus:ring-primary"
									aria-label={`Pilih ${u.name}`}
								/>
							</td>
							<td class="text-center font-mono text-xs text-ink-muted">
								{(data.page - 1) * data.perPage + index + 1}
							</td>
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
										class="grid size-8 place-items-center rounded text-ink-muted hover:bg-surface-raised hover:text-primary"
										title="Lihat detail pengguna"
										onclick={() => {
											selectedUser = u;
											detailOpen = true;
										}}
									>
										<Icon name="eye" size={15} />
									</button>
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

									{#if u.isActive}
										<button
											type="button"
											class="btn btn-ghost btn-sm text-xs hover:text-danger"
											title="Nonaktifkan akun"
											onclick={() => {
												userToDeactivate = u;
												deactivateDialogOpen = true;
											}}
										>
											Nonaktifkan
										</button>
									{:else}
										<form method="POST" action="?/toggleActive" use:enhance class="inline-block">
											<input type="hidden" name="id" value={u.id} />
											<input type="hidden" name="active" value="true" />
											<button
												type="submit"
												class="btn btn-ghost btn-sm text-xs text-success hover:bg-success/10"
												title="Aktifkan akun"
											>
												Aktifkan
											</button>
										</form>
									{/if}
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

{#if selectedIds.length > 0}
	<div
		class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2.5 rounded-xl border border-border-strong bg-surface px-4 py-2.5 shadow-2xl backdrop-blur-md"
		role="toolbar"
		aria-label="Aksi masal pengguna"
	>
		<span class="text-xs font-bold text-ink">
			{selectedIds.length} pengguna terpilih
		</span>

		<div class="h-4 w-px bg-border-base"></div>

		<!-- Aktifkan Masal -->
		<form
			method="POST"
			action="?/bulkToggleActive"
			use:enhance={() => {
				bulkBusy = true;
				return async ({ result }) => {
					bulkBusy = false;
					if (result.type === 'success' || result.type === 'redirect') {
						selectedIds = [];
					}
					await applyAction(result);
				};
			}}
		>
			{#each selectedIds as id}
				<input type="hidden" name="ids" value={id} />
			{/each}
			<input type="hidden" name="active" value="true" />
			<button
				type="submit"
				disabled={bulkBusy}
				class="btn btn-secondary btn-sm text-xs text-success hover:bg-success/10"
			>
				Aktifkan
			</button>
		</form>

		<!-- Tombol trigger modal Nonaktifkan Masal -->
		<button
			type="button"
			disabled={bulkBusy}
			class="btn btn-secondary btn-sm text-xs text-danger hover:bg-danger/10"
			onclick={() => (bulkDeactivateOpen = true)}
		>
			Nonaktifkan
		</button>

		<button
			type="button"
			class="btn btn-ghost btn-sm text-xs text-ink-muted hover:text-ink"
			onclick={() => (selectedIds = [])}
		>
			Batal
		</button>
	</div>
{/if}

<!-- Hidden Form for Bulk Deactivate -->
<form
	id="bulkDeactivateForm"
	method="POST"
	action="?/bulkToggleActive"
	class="hidden"
	use:enhance={() => {
		bulkBusy = true;
		return async ({ result }) => {
			bulkBusy = false;
			bulkDeactivateOpen = false;
			if (result.type === 'success' || result.type === 'redirect') {
				selectedIds = [];
			}
			await applyAction(result);
		};
	}}
>
	{#each selectedIds as id}
		<input type="hidden" name="ids" value={id} />
	{/each}
	<input type="hidden" name="active" value="false" />
</form>

<!-- Hidden Form for Single Deactivate -->
<form
	id="singleDeactivateForm"
	method="POST"
	action="?/toggleActive"
	class="hidden"
	use:enhance={() => {
		deactivating = true;
		return async ({ result }) => {
			deactivating = false;
			deactivateDialogOpen = false;
			userToDeactivate = null;
			await applyAction(result);
		};
	}}
>
	<input type="hidden" name="id" value={userToDeactivate?.id} />
	<input type="hidden" name="active" value="false" />
</form>

<!-- Modal Konfirmasi Nonaktifkan User (Custom Estetik) -->
<ConfirmDialog
	bind:open={deactivateDialogOpen}
	title="Nonaktifkan pengguna?"
	message={`Akun "${userToDeactivate?.name ?? ''}" (${userToDeactivate?.email ?? ''}) akan dinonaktifkan dan semua sesi login aktifnya akan langsung dicabut.`}
	confirmLabel="Ya, nonaktifkan"
	cancelLabel="Batal"
	variant="danger"
	loading={deactivating}
	onconfirm={() => {
		const formEl = document.getElementById('singleDeactivateForm') as HTMLFormElement;
		formEl?.requestSubmit();
	}}
/>

<!-- Modal Konfirmasi Nonaktifkan Masal (Custom Estetik) -->
<ConfirmDialog
	bind:open={bulkDeactivateOpen}
	title="Nonaktifkan pengguna terpilih?"
	message={`Apakah kamu yakin ingin menonaktifkan ${selectedIds.length} akun pengguna yang dipilih? Sesi login mereka akan dicabut.`}
	confirmLabel={`Ya, nonaktifkan ${selectedIds.length} pengguna`}
	cancelLabel="Batal"
	variant="danger"
	loading={bulkBusy}
	onconfirm={() => {
		const formEl = document.getElementById('bulkDeactivateForm') as HTMLFormElement;
		formEl?.requestSubmit();
	}}
/>

<!-- Modal Detail Pengguna (Custom Estetik) -->
<Dialog
	bind:open={detailOpen}
	title="Detail Pengguna"
	description="Informasi lengkap akun anggota tim."
>
	{#if selectedUser}
		<div class="stack">
			<div class="flex items-center gap-3 border-b border-border-base pb-4">
				<Avatar name={selectedUser.name} size="lg" />
				<div>
					<h3 class="font-bold text-ink">{selectedUser.name}</h3>
					<p class="text-xs text-ink-muted">{selectedUser.email}</p>
					<div class="mt-1 flex items-center gap-1.5">
						<Chip tone={selectedUser.role === 'OWNER' ? 'urgent' : 'neutral'}>
							{selectedUser.role === 'OWNER' ? 'Owner' : 'User'}
						</Chip>
						<Chip tone={selectedUser.isActive ? 'done' : 'blocked'}>
							{selectedUser.isActive ? 'Aktif' : 'Nonaktif'}
						</Chip>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3 text-xs">
				<div class="surface-card p-3">
					<span class="text-ink-muted">User ID</span>
					<p class="mt-1 font-mono font-semibold text-ink break-all">{selectedUser.id}</p>
				</div>
				<div class="surface-card p-3">
					<span class="text-ink-muted">Ganti Password Wajib</span>
					<p class="mt-1 font-semibold text-ink">
						{selectedUser.mustChangePassword ? 'Ya' : 'Tidak'}
					</p>
				</div>
				<div class="surface-card p-3">
					<span class="text-ink-muted">Terakhir Aktif</span>
					<p class="mt-1 font-semibold text-ink">
						{selectedUser.lastSeenAt ? formatDateTime(selectedUser.lastSeenAt) : 'Belum pernah'}
					</p>
				</div>
				<div class="surface-card p-3">
					<span class="text-ink-muted">Akun Dibuat</span>
					<p class="mt-1 font-semibold text-ink">{formatDateTime(selectedUser.createdAt)}</p>
				</div>
			</div>

			<div class="mt-3 flex justify-end gap-2 border-t border-border-base pt-3">
				<Button variant="secondary" size="sm" onclick={() => (detailOpen = false)}>
					Tutup
				</Button>
				<Button
					variant="primary"
					size="sm"
					onclick={() => {
						detailOpen = false;
						openEdit(selectedUser);
					}}
				>
					<Icon name="edit" size={14} />
					Ubah data
				</Button>
			</div>
		</div>
	{/if}
</Dialog>

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
				await applyAction(result);
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
				await applyAction(result);
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
				await applyAction(result);
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
