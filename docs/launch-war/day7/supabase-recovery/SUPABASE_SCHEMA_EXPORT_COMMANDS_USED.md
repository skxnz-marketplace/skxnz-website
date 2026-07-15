# Supabase schema export commands used

No schema export command was run.

| Command | Result | Safety note |
| --- | --- | --- |
| `supabase --version` | CLI command unavailable | No authentication or network action occurred. |
| `Get-Command supabase` | Not found | Local PATH inspection only. |
| `where.exe supabase` | Not found | Local PATH inspection only. |
| `npx supabase --version` | Timed out after 124 seconds without output | No login, token, OTP, SQL, or dump action occurred. |
| `npx --no-install supabase --version` | Timed out after 34 seconds without output | Did not establish a locally cached usable CLI. |
| `npx supabase --version` (final retry) | Timed out after 64 seconds without output | Exact requested command; no prompt or credential input was supplied. |
| `supabase status` | Not run after CLI absence | Would have had output suppressed. |
| `supabase projects list` | Not run after CLI absence | Avoided a network/auth attempt. |
| `supabase link --help` | Not run after CLI absence | CLI unavailable. |
| `supabase db dump --help` | Not run after CLI absence | CLI unavailable; no dump syntax guessed. |

No `.env` file was opened. No candidate SQL file exists. The npx CLI did not
reach a usable help/status/projects/dump state, so those commands were not
retried individually.
