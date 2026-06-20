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
  const { id } = req.query;

  if (typeof id !== "string" || !id.trim()) {
    return res.status(400).json({ error: "A valid notice id is required." });
  }

  try {
    if (req.method === "GET") {
      const notice = await prisma.notice.findUnique({ where: { id } });

      if (!notice) {
        return res.status(404).json({ error: "Notice not found." });
      }

      return res.status(200).json({ data: serializeNotice(notice) });
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      const parsed = validateNotice(req.body);
      if (!parsed.ok) {
        return res.status(400).json({ error: "Invalid notice data.", fields: parsed.errors });
      }

      const existing = await prisma.notice.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "Notice not found." });
      }

      const updated = await prisma.notice.update({
        where: { id },
        data: {
          title: parsed.data.title,
          body: parsed.data.body,
          category: parsed.data.category,
          priority: parsed.data.priority,
          publishDate: new Date(`${parsed.data.publishDate}T00:00:00.000Z`),
          image: parsed.data.image,
        },
      });

      return res.status(200).json({ data: serializeNotice(updated) });
    }

    if (req.method === "DELETE") {
      const existing = await prisma.notice.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "Notice not found." });
      }

      await prisma.notice.delete({ where: { id } });
      return res.status(204).end();
    }

    res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]);
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error(`API /api/notices/${id} error:`, error);
    const message =
      process.env.NODE_ENV === "production"
        ? "Unexpected server error."
        : error instanceof Error
          ? error.message
          : "Unexpected server error.";

    return res.status(500).json({ error: message });
  }
}
