# Opik UI reference — phân tích cho AnnoBot Copilot

> Phân tích 6 ảnh chụp Opik (dark theme) để làm tham chiếu khi xây dựng
> **Annotation Copilot** trong `annobot-fe`. Đây là tài liệu tham khảo UI,
> không phải spec bắt buộc.
>
> Nguồn ảnh: màn `Logs` (thread list), màn `Trace` (spans tree + span detail),
> màn `Thread` (messages), và các trạng thái của panel **Ollie** (expanded /
> collapsed rail / overlay menu).
>
> Điểm đặc biệt: ảnh chụp cho thấy Opik **đã instrument `chat_agent` của
> AnnoBot** — xem mục 7.

---

## 1. Layout tổng thể: 3 vùng

```
┌──────────────┬──────────────────────────────────────────────┬──────────────────┐
│ App sidebar  │ Main content                                 │ AI Copilot panel │
│ (điều hướng) │ (danh sách / chi tiết)                       │ (Ollie)          │
│              │                                              │ docked, thu gọn  │
└──────────────┴──────────────────────────────────────────────┴──────────────────┘
```

- **Vùng 1 — App sidebar** (trái, cố định): project switcher ở trên cùng, các
  nhóm nav có tiêu đề nhóm (`Observability`, `Development`, `Evaluation`,
  `Production`), mục đang active tô nền; đáy sidebar có `Workspace`,
  `Configuration`, và nút `Star`.
- **Vùng 2 — Main content**: tự đổi theo route. Luôn có header trang
  (title trái + action phải), rồi tới nội dung (list hoặc master-detail).
- **Vùng 3 — AI Copilot panel** (phải): **docked**, không che nội dung; có 3
  trạng thái: expanded, collapsed thành rail dọc, và overlay (khi hẹp).

Tỉ lệ: sidebar ~250px, copilot ~400–430px, main co giãn phần còn lại.

---

## 2. AI Copilot panel (Ollie) — anatomy

### 2.1 Header (ảnh 4)

```
[ » ]  │  ⭘⭘ Ollie   New chat                          🕘  ＋
 ▲          ▲         ▲                                  ▲   ▲
 nút gập   brand    session label                     history  new
 (ghost)   +icon    (muted)                          (ghost)  (ghost)
```

- Nút gập `»` nằm trong một button bo góc (ghost), có **divider dọc** ngăn với
  brand.
- Brand: icon + tên (`Ollie`) — tên dùng **font mono**, đậm hơn phần còn lại.
- Session label (`New chat`) màu muted, ngay cạnh brand.
- Bên phải: icon history (clock) + icon tạo mới (`+`), đều là ghost icon button.

### 2.2 Body — empty state (ảnh 1, 2)

- Câu mở đầu ngắn: *"Investigate traces, analyze performance, or run actions."*
- Danh sách gợi ý dạng **slash command**, mỗi dòng: `Run /command to …` trong
  đó tên command tô **màu accent** và dùng **mono**; phần còn lại màu chữ thường.
- Đây là "onboarding inline" thay cho việc nhồi hướng dẫn vào placeholder.

### 2.3 Footer (ảnh 1, 2)

```
> Send a message ...
? for shortcuts                         Connect Ollie locally
```

- Input có **prefix `>`** (mono, muted) — tạo cảm giác terminal/chat.
- Dòng dưới input: gợi ý phím tắt (trái) + link phụ (phải), cả hai đều nhỏ, muted.

### 2.4 Trạng thái thu gọn — vertical rail (ảnh 3)

- Khi gập, panel co thành **dải dọc rất hẹp** (~40px), vẫn giữ nút mở `»` ở
  trên cùng, phần còn lại hiển thị **tên panel xoay 90°** (`Ollie`).
- Đây là điểm rất đáng copy: thay vì ẩn hẳn, panel để lại một "tab dọc" để mở
  lại nhanh.

### 2.5 Overlay menu (ảnh 2)

- Menu nhỏ nổi ngay dưới header: `resume session` / `no sessions found` —
  tức là **session history** nằm trong một dropdown, không phải một trang riêng.
- Khi panel hẹp, nó **overlay** lên main content (thấy được mép bảng phía sau).

---

## 3. Main content — danh sách (ảnh 1)

Thứ tự trên xuống:

1. **Page header**: `Logs` (title, đậm) + nút `Set a guardrail` (outline) bên phải.
2. **Tab loại entity**: `Threads | Traces | Spans` (tab ngang, dạng segmented).
   Bên phải cùng hàng: icon cấu hình cột, nút `Columns 8/14`, dropdown
   `Past 30 days`, icon refresh.
3. **Stat cards**: 3 ô ngăn bằng đường kẻ dọc, mỗi ô: icon + nhãn + giá trị lớn
   + **delta** (`↓ 90.9%`) tô màu.
4. **Histogram** full-width: trục X là ngày (`08/26 … 09/23`), trục Y 0..1,
   cột tím (accent) — dùng để thấy phân bố theo thời gian.
5. **Filter bar**: ô search `Search by anything` + các chip filter có mũi tên
   (`Tags ▾`, `Duration ▾`, `Start time ▾`) + `All filters`.
6. **Table**: cột `[checkbox] | Start time | First message | Last message | Me…`.
   - Hàng có **viền trái màu** (accent xanh) để đánh dấu trạng thái.
   - Preview text bị **truncate bằng `…`**.
   - Hàng rỗng vẫn hiển thị (`-`) để giữ form bảng.
7. **Table footer**: `Rows per page: 100 ▾` (trái) + phân trang
   `|‹ ‹ Showing 1-1 of 1 › ›|` (phải).

---

## 4. Trace / Spans inspector (ảnh 5) — pattern quan trọng nhất

**Master–detail 2 cột:**

```
┌────────────────────────────┬──────────────────────────────────────────┐
│ Spans (12)   🔍 ▼ ⋮       │  chat_agent            Add to ▾  Annotate │
│                            │  ──────────────────────────────────────── │
│ ▸ chat_agent  6.4s <$0.01  │  📅 23 Sep 2026, 7:48 PM · 6.4s · #21289 ·│
│   ▸ model 3.6s             │  🏷 chat_agent  il  start  +              │
│     ▸ ChatOpenAI 3.5s      │  [ Messages | Details | Feedback scores ] │
│   ▸ tools 0.005s           │  ┌ LLM messages ──────────────── ⤢ ⧉ ┐   │
│     ▸ get_documents_index  │  │ ▸ Human                          │   │
│   ▸ tools 0.02s            │  │ ▸ AI                             │   │
│     ▸ get_case_context     │  │ ▸ Tool  get_documents_index      │   │
│   ▸ tools 0.03s            │  │ ▸ Tool  get_case_context         │   │
│     ▸ get_sensor_metadata  │  │ ▸ Tool  get_sensor_metadata      │   │
│   ▸ tools 0.03s            │  │ ▸ Tool  get_cycle_raw_events     │   │
│     ▸ get_cycle_raw_events │  │ ▸ AI                             │   │
│   ▸ model 2.7s             │  └──────────────────────────────────┘   │
│     ▸ ChatOpenAI 2.7s      │                                          │
└────────────────────────────┴──────────────────────────────────────────┘
```

### 4.1 Span tree (cột trái)

- Tiêu đề `Spans (12)` + icon search/filter/sắp xếp/menu.
- **Cây phân cấp** với đường nối dọc; node cha gập/mở được.
- Mỗi node: **icon màu theo loại span** + tên + các chỉ số nhỏ cùng dòng:
  `duration`, `cost`, `#id`.
  - `chat_agent` (root) — icon tím.
  - `model` — icon xanh lá (nhóm).
  - `ChatOpenAI` — icon xanh dương (LLM call), kèm `provider model` + `#tokens`.
  - `tools` — icon xanh lá (nhóm).
  - `get_*` — icon hồng/magenta (tool call).
- Node đang chọn: **nền sáng hơn + thanh accent bên trái**.

### 4.2 Span detail (cột phải)

- **Title row**: tên span + nút copy; bên phải `Add to ▾` + `Annotate A`.
- **Meta row**: icon lịch + ngày giờ · duration · `#id` · cost.
- **Tag row**: icon tag + các chip tag (`chat_agent`, `il`, `start`) + nút `+`.
- **Tabs**: `Messages | Details | Feedback scores`.
- **Section gập được** (mỗi section có header + menu định dạng `Pretty ▾` hoặc
  `YAML ▾` + icon search + icon copy):
  - `Input` — hộp text nền hơi tối, mono-ish, hiển thị payload thô.
  - `Output` — prose có **bold** ở các thực thể quan trọng (số liệu, tên cảm
    biến, khung giờ). Đây là output thật của `chat_agent`.
  - `Metadata` — YAML (`providers`, `model`, `created_from`, `ls_integration`,
    `lc_agent_name`, `thread_id`).
  - `Token usage` — YAML (`completion_tokens`, `original_usage…`).
- **`LLM messages`**: danh sách hàng gập được theo **vai trò** với icon riêng:
  `Human` (icon người), `AI` (icon AI), `Tool` (icon tool) + tên tool.

---

## 5. Thread detail — Messages (ảnh 6)

- Header: nút back `»` + `Thread` + copy + link; phải: `…` + `Traces ↗`.
- `Inspect` (title) + `Add to ▾` + `Annotate A`.
- Meta row: ngày giờ · `# 2 messages` · duration · cost.
- Tag row: icon tag + `+`.
- Tabs: `Messages | Feedback scores`.
- **Cách render message — khác hoàn toàn chat bubble:**
  - **System message**: một **khối chữ nhật bo góc, nền tint xanh navy nhạt**,
    chữ hơi mono. Tách bạch rõ với message thường.
  - **Assistant message**: **plain prose, không bubble**, có **bold** cho thực
    thể; xuống dòng tự nhiên.
  - **Action row dưới mỗi message**: `👍 👎 | Trace ↗ | Tool calls ↗` — nhỏ,
    muted, là link nhảy sang trace/tool calls của lượt đó.

> Điểm cốt lõi: Opik **tách "chat" (Ollie) khỏi "inspection" (Thread/Spans)**.
> Ollie để *hỏi agent*, còn Thread/Spans để *soi lại điều agent đã làm*.

---

## 6. Tokens quan sát được (dark)

| Yếu tố | Quan sát |
| --- | --- |
| Nền | Nền tối gần đen, panel/nội dung phân tầng bằng `bg-card`/`bg-muted` rất nhẹ |
| Viền | Viền 1px mảnh, độ tương phản thấp, phân vùng bằng border chứ không bằng shadow |
| Accent | Tím (brand Opik) dùng cho cột histogram, thanh selected, link command |
| Màu theo loại span | tím / xanh lá / xanh dương / hồng — **mã hoá ngữ nghĩa**, luôn kèm icon + tên |
| Typography | Sans cho prose; **mono cho id, số, tên command, session name, nhãn** |
| Density | Rất gọn: text `xs`/`sm`, metadata màu muted, hàng ~32–40px |
| Tương tác | Icon button ghost; hover tô nền nhẹ; không dùng shadow nặng |

Lưu ý cho AnnoBot: repo dùng token semantic (`--chart-1..10`, `--muted`,
`--border`). **Không copy mã màu thô** của Opik; map "màu theo loại span" sang
`--chart-*`.

---

## 7. Phát hiện quan trọng: Opik đã trace `chat_agent` của AnnoBot

Ảnh 5 cho thấy trace thật của AnnoBot:

- Span root `chat_agent`, 6.4s, `<$0.01`, `#21289`.
- Nhánh `model` → `ChatOpenAI` (`openai/gpt-4o-mini`), token `#1764`, `#19525`.
- Các nhánh `tools`: `get_documents_index`, `get_case_context`,
  `get_sensor_metadata`, `get_cycle_raw_events`.
- `Metadata`: `lc_integration: langchain_create_agent`,
  `lc_agent_name: chat_agent`,
  `thread_id: 7086301357:2026-09-23 08:30:00+00:00`.
- `Input`: `[system] Bắt đầu hỏi annotation mới. Lý do trigger: …`.
- `Output`: chính là câu hỏi agent gửi cư dân (có bold số liệu 105.2 W, 9:00–9:18).

**Hệ quả cho kế hoạch:**

1. Node "LLM reasoning spans / tool calls" trong Trace Inspector **không cần tự
   dựng lại** từ LangGraph checkpointer — dữ liệu đã có trong Opik
   (`OpikTracer` đã gắn ở `ai-service/agents/chat_agent.py`).
2. Hai lựa chọn:
   - **Deep-link** sang Opik (nhanh, ít code): nút `Trace ↗` mở thẳng span URL.
   - **Fetch qua Opik API** rồi render lại bằng component của mình (kiểm soát UI,
     nhưng tốn công hơn).
3. `thread_id` trong Opik = `{telegram_user_id}:{timecheck}` — khớp đúng
   `ai.threads.id`. Đây là **khoá nối** giữa case và trace. Khi chuyển sang
   web-only, nếu đổi sang `case:{case_id}` thì phải đổi cả metadata trace.

---

## 8. Mapping sang AnnoBot — nên lấy gì, bỏ gì

| Opik | AnnoBot nên làm |
| --- | --- |
| Copilot panel docked, gập thành rail dọc | ✅ Lấy — đúng thứ plan cần |
| Header: gập · brand · session · history · new | ✅ Lấy, đổi "session" thành **case hiện tại**; thêm điều hướng `< Case x/y >` |
| Empty state + slash-command hints | 🔶 Lấy ý tưởng, nhưng hint phải là hướng dẫn gán nhãn (không phải `/instrument`) |
| Input có prefix `>` | ✅ Lấy (mono prefix) |
| **Tách chat vs inspection** | ✅ Lấy — Chat tab = agent hỏi; Trace tab = soi điều đã xảy ra |
| Span tree master–detail | ✅ Lấy — chính là Trace Inspector; dữ liệu lấy từ Opik (mục 7) |
| Span detail: meta row, tag chips, tabs, section gập + format menu | ✅ Lấy |
| Message list kiểu "inspect" (system = khối tint, assistant = prose + bold, action row) | ✅ Lấy cho tab Trace/Messages; nhưng tab Chat vẫn dùng bubble (đang có) |
| Stat cards + delta, histogram, filter chips, column visibility | 🔶 Áp cho danh sách Case (đã có stat tiles + timeline; bổ sung delta & filter chips) |
| Collapsed rail + overlay khi hẹp | ✅ Lấy — hiện `cases.tsx` mới chỉ có mở/đóng |

**Khác biệt bản chất cần nhớ:** Ollie là *meta-assistant* để phân tích trace;
copilot AnnoBot là *annotation agent* hỏi cư dân 5W1H rồi commit. Nên:
- Panel AnnoBot phải có **form/Questionnaire** (đã có), không chỉ chat.
- Phải có **trạng thái hoàn tất + tự chuyển case kế** (Queue Autopilot).
- Phải có **QC conflict card** (cooperative learning) — Opik không có.

---

## 9. Đối chiếu với code hiện tại (`annobot-fe`)

### Đã có

- `src/features/cases/components/copilot/`
  - `case-copilot-context.tsx` — provider controlled (`activeId` + `onActiveChange`).
  - `case-copilot-panel.tsx` — header (brand, queue nav `< x/y >`, nút đóng),
    `Tabs` Chat/Trace, empty state.
  - `case-chat-pane.tsx` — `MessageScroller`/`Message`/`Bubble`/`Marker` + composer.
  - `case-copilot-rich.tsx` — `CaseQuestionnaire` (shadcn `Questionnaire`),
    `QcConflictCard`, `AnnotationSummaryCard`.
  - `case-trace-tree.tsx` — cây vòng đời (Collapsible + Badge).
  - `mock.ts` / `types.ts` — dữ liệu mẫu.
- `src/routes/.../cases.tsx` — `?case=` search param, nút "Annotation copilot"
  trong page actions, layout 2 cột `Resizable` khi mở, `CasesTable` chọn hàng.
- `cases-table.tsx` — `activeCaseId` (tô nền hàng) + `onSelect` (nút mở copilot).

### Còn thiếu so với Opik (TODO cho code model)

Đã triển khai trong đợt build này:

- [x] **Collapsed rail**: `CaseCopilotRail` — dải dọc giữ nút mở + tên xoay 90°.
- [x] **Session/history menu**: `SessionMenu` (DropdownMenu) liệt kê hàng đợi.
- [x] **Span inspector**: `CaseSpanInspector` — master–detail (cây spans + pane).
- [x] **Span detail**: meta row, tag chips, tabs `Messages/Details`, section gập
      `Input/Output/Metadata/Token usage`.
- [x] **Message list kiểu inspect**: `InspectTurn` (agent prose + bold, hàng
      hành động `👍 👎 | Trace | Tool calls`; cư dân vẫn dùng bubble).
- [x] **Danh sách case**: filter chips theo giai đoạn (`StageFilter`), search
      (`CasesSearchInput`), column visibility (`ColumnsMenu`).
- [x] **Queue Autopilot**: `AutopilotBanner` đếm ngược rồi tự sang case kế.

Còn lại (chờ backend / quyết định):

1. **Dữ liệu span thật từ Opik**: hiện `mock.ts` sinh span tree; cần gọi Opik
   API hoặc deep-link (mục 7).
2. **`is_done` từ agent**: khi commit xong, backend phải trả tín hiệu để bật
   `AutopilotBanner` (hiện suy ra từ `case.status`).
3. **Delta trên stat tiles**: chưa làm vì chưa có dữ liệu kỳ trước; không bịa số.
4. **Mobile**: panel nên chuyển thành `Sheet` khi `useIsMobile()`.
5. **Contract chat**: `POST /cases/{id}/chat` trả `{reply, is_done, …}`.


---

## 10. Nguyên tắc UI bắt buộc (nhắc lại)

- Chỉ dùng component trong `src/components/ui/`; thiếu thì `npx shadcn@latest add`.
- Tuân thủ composition: `Card/CardHeader/CardContent`, `Tabs/TabsList/TabsTrigger`,
  `Item/ItemMedia/ItemContent`, `Empty/…`, `Collapsible/…`, `Badge`, `Separator`.
- **Không** override màu/typography bằng class thô; dùng token semantic.
- Không `space-y-*`; dùng `flex flex-col gap-*`. Kích thước bằng `size-*`.
- Chat dùng đúng bộ primitive: `MessageScroller`, `Message`, `Bubble`, `Marker`,
  `Attachment`; câu hỏi dùng `Questionnaire`.
