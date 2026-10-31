# Instruksi Operasional File (MUTLAK)

- DILARANG KERAS membuat file lewat terminal script (contoh: Python inline `python3 -c`, cat << EOF, echo >).
- DILARANG KERAS mengedit file lewat manipulasi regex shell (contoh: Python file rewrite, sed, awk, inline replace script).
- Pembuatan dan perubahan file WAJIB memakai tool resmi: Tool MCP Filesystem `write_file` / `edit_file` atau tool IDE `write_file` / `edit_file`.
- Shell (terminal) HANYA digunakan untuk running proses (git, build, test, package manager, dev server).

# MANDATORY OBSIDIAN VAULT RAG INTEGRATION (Mng-Task)

- **Global Obsidian Vault Path**: `/home/pak-hakim/Pak-Hakim/Worker/Obsidian/Obsidian`
- **AGY Memory Project Root**: `00-AGY-Memory/Mng-Task/`
- **MCP Server**: `obsidian` (`obsidian.search_notes`, `obsidian.read_notes`)
- **Protocol**:
  1. Selalu baca `00-AGY-Memory/Mng-Task/CONTEXT.md` dan sesi terkini sebelum memulai modifikasi.
  2. Saat user bertanya seputar arsitektur, database, rule, atau referensi modul, gunakan MCP Obsidian untuk mencari catatan di vault sebelum menjawab.
  3. Dokumentasikan pembaruan penting di `00-AGY-Memory/Mng-Task/Sessions/`.

