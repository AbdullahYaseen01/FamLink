# Hero images

Save the six hero photos here using these exact filenames — each template
references the matching file as its hero background:

| Filename | Used by | Photo |
| --- | --- | --- |
| `01-welcome.jpg` | `01-welcome-after-signup.html` | Two moms + kids at a park picnic |
| `02-subscription-plus.jpg` | `02-subscription-confirmed.html` | Mom reading on a couch (has the **FAMILY+** badge baked in) |
| `03-new-match-request.jpg` | `03-new-match-request.html` | Two moms chatting at a kitchen island (**POTENTIAL MATCH** badge baked in) |
| `04-its-a-match.jpg` | `04-match-request-accepted.html` | Two moms in a backyard (**heart** badge baked in) |
| `05-new-message.jpg` | `05-new-message-received.html` | Mom texting on a couch (**message** badge baked in) |
| `06-complete-profile.jpg` | `06-complete-your-profile.html` | Mom at a laptop with a child coloring |

## Notes

- The templates reference these via a **relative path** (`images/<file>.jpg`) so they
  preview correctly when you open the `.html` files locally with the photos in place.
- **For production email**, images must be absolute, publicly-hosted URLs. Host this
  folder on your CDN/server and find/replace `images/` with your base URL, e.g.
  `src="images/01-welcome.jpg"` → `src="https://yourcdn.com/emails/01-welcome.jpg"`.
- Photos 02–05 already include their badge in the top-right, so the templates do
  **not** add a CSS badge for those (no duplicates).
- Recommended export: ~960×480 px (or larger, same 2:1-ish ratio), JPG, quality ~80.
