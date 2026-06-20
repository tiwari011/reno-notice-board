import { prisma } from "@/lib/prisma";

const allowedCategories = ["Exam", "Event", "General"];
const allowedPriorities = ["Normal", "Urgent"];

function validateNotice(data) {
  const errors = {};
  const title = typeof data?.title === "string" ? data.title.trim() : "";
  const body = typeof data?.body === "string" ? data.body.trim() : "";
  const category = typeof data?.category === "string" ? data.category.trim() : "";
  const priority = typeof data?.priority === "string" ? data.priority.trim() : "";
  const publishDate =
    typeof data?.publishDate === "string" ? data.publishDate.trim() : "";
  const image = typeof data?.image === "string" ? data.image.trim() : "";

  if (!title) errors.title = "Title is required.";
  if (!body) errors.body = "Body is required.";
  if (!allowedCategories.includes(category)) {
    errors.category = "Choose a valid category.";
  }
  if (!allowedPriorities.includes(priority)) {
    errors.priority = "Choose a valid priority.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishDate) || Number.isNaN(new Date(`${publishDate}T00:00:00.000Z`).getTime())) {
    errors.publishDate = "Publish date must be valid.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      title,
      body,
      category: category.toUpperCase(),
      priority: priority.toUpperCase(),
      publishDate,
      image: image || null,
    },
  };
}

function serializeNotice(notice) {
  return {
    ...notice,
    publishDate: notice.publishDate.toISOString(),
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString(),
    category: notice.category.charAt(0) + notice.category.slice(1).toLowerCase(),
    priority: notice.priority.charAt(0) + notice.priority.slice(1).toLowerCase(),
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const notices = await prisma.notice.findMany({
        orderBy: [{ priority: "desc" }, { publishDate: "desc" }, { createdAt: "desc" }],
      });
      return res.status(200).json({ data: notices.map(serializeNotice) });
    }

    if (req.method === "POST") {
      const parsed = validateNotice(req.body);
      if (!parsed.ok) {
        return res.status(400).json({ error: "Invalid notice data.", fields: parsed.errors });
      }

      const created = await prisma.notice.create({
        data: {
          title: parsed.data.title,
          body: parsed.data.body,
          category: parsed.data.category,
          priority: parsed.data.priority,
          publishDate: new Date(`${parsed.data.publishDate}T00:00:00.000Z`),
          image: parsed.data.image,
        },
      });

      return res.status(201).json({ data: serializeNotice(created) });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("API /api/notices error:", error);
    const message =
      process.env.NODE_ENV === "production"
        ? "Unexpected server error."
        : error instanceof Error
          ? error.message
          : "Unexpected server error.";

    return res.status(500).json({ error: message });
  }
}
