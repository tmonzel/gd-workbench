let items = [];
const pageSize = 24;
let pendingRequest = { page: 0, search: "", category: "All" };

const matches = (item, search, category) => {
  const haystack =
    `${item.name} ${item.description} ${item.category}`.toLowerCase();
  return (
    (!search || haystack.includes(search)) &&
    (category === "All" || item.category === category)
  );
};

const sendPage = (page, search = "", category = "All") => {
  const filtered = items.filter((item) => matches(item, search, category));
  postMessage({
    type: "page",
    page,
    pageSize,
    total: filtered.length,
    items: filtered.slice(page * pageSize, (page + 1) * pageSize),
  });
};

onmessage = (event) => {
  const { type, page = 0, search = "", category = "All" } = event.data;
  if (type === "load") {
    fetch("/data/items.json")
      .then((response) => response.json())
      .then((data) => {
        items = data;
        postMessage({
          type: "ready",
          total: items.length,
          categories: ["All", ...new Set(items.map((item) => item.category))],
        });
        sendPage(
          pendingRequest.page,
          pendingRequest.search,
          pendingRequest.category,
        );
      })
      .catch((error) =>
        postMessage({
          type: "error",
          message: error instanceof Error ? error.message : String(error),
        }),
      );
  }
  if (type === "page") {
    pendingRequest = { page, search: search.trim().toLowerCase(), category };
    if (items.length)
      sendPage(
        pendingRequest.page,
        pendingRequest.search,
        pendingRequest.category,
      );
  }
};
