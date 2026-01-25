-- AlterTable tasks - Add new fields for Kanban/Planning
ALTER TABLE "tasks" ADD COLUMN "boardId" TEXT;
ALTER TABLE "tasks" ADD COLUMN "columnId" TEXT;
ALTER TABLE "tasks" ADD COLUMN "position" INTEGER DEFAULT 0;
ALTER TABLE "tasks" ADD COLUMN "viewType" TEXT DEFAULT 'list';
ALTER TABLE "tasks" ADD COLUMN "metadata" JSONB;

-- CreateTable TaskBoard
CREATE TABLE "task_boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "layout" JSONB,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable TaskColumn
CREATE TABLE "task_columns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#6B7280',
    "position" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable PlanningView
CREATE TABLE "planning_views" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "viewType" TEXT NOT NULL DEFAULT 'calendar',
    "preferences" JSONB,
    "defaultView" BOOLEAN NOT NULL DEFAULT false,
    "filterOptions" JSONB,
    "layoutConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "tasks_boardId_idx" ON "tasks"("boardId");
CREATE INDEX "tasks_columnId_idx" ON "tasks"("columnId");
CREATE INDEX "tasks_position_idx" ON "tasks"("position");

CREATE INDEX "task_boards_userId_idx" ON "task_boards"("userId");
CREATE INDEX "task_boards_isDefault_idx" ON "task_boards"("isDefault");

CREATE INDEX "task_columns_boardId_idx" ON "task_columns"("boardId");
CREATE INDEX "task_columns_position_idx" ON "task_columns"("position");

CREATE INDEX "planning_views_userId_idx" ON "planning_views"("userId");
CREATE INDEX "planning_views_viewType_idx" ON "planning_views"("viewType");
CREATE INDEX "planning_views_defaultView_idx" ON "planning_views"("defaultView");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "task_boards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "task_columns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task_boards" ADD CONSTRAINT "task_boards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_columns" ADD CONSTRAINT "task_columns_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "task_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planning_views" ADD CONSTRAINT "planning_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
