import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Controller("drills")
export class DrillsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getDrills() {
    return this.prisma.drill.findMany();
  }

  @Get(":id")
  async getDrill(@Param("id") id: string) {
    return this.prisma.drill.findUnique({
      where: { id },
    });
  }

  @Get(":id/layout")
  async getLayout(@Param("id") id: string) {
    const drill = await this.prisma.drill.findUnique({
      where: { id },
      select: {
        layout: true,
      },
    });

    return drill?.layout ?? null;
  }

  @Put(":id/layout")
  async saveLayout(@Param("id") id: string, @Body() body: any) {
    const payload = {
      items: Array.isArray(body?.items) ? body.items : [],
      lines: Array.isArray(body?.lines) ? body.lines : [],
      updatedAt:
        typeof body?.updatedAt === "string"
          ? body.updatedAt
          : new Date().toISOString(),
    };

    const updated = await this.prisma.drill.update({
      where: { id },
      data: {
        layout: payload,
      },
      select: {
        layout: true,
      },
    });

    return updated.layout ?? null;
  }
}