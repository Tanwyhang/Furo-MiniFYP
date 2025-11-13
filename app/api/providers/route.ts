import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// GET /api/providers - List all providers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { walletAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        skip,
        take: limit,
        include: {
          Api: {
            select: {
              id: true,
              name: true,
              category: true,
              pricePerCall: true,
              isActive: true,
              totalCalls: true,
              averageResponseTime: true,
              uptime: true
            }
          },
          _count: {
            select: {
              Api: true,
              Payment: true,
              Token: true
            }
          }
        },
        orderBy: [
          { reputationScore: 'desc' },
          { totalCalls: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.provider.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: providers,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

// POST /api/providers - Create a new provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      name,
      description,
      website,
      avatarUrl,
      email
    } = body;

    // Validation
    if (!walletAddress || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: walletAddress and name are required'
        },
        { status: 400 }
      );
    }

    // Check if provider already exists
    const existingProvider = await prisma.provider.findFirst({
      where: {
        OR: [
          { walletAddress },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existingProvider) {
      return NextResponse.json(
        {
          success: false,
          error: 'Provider with this wallet address or email already exists'
        },
        { status: 409 }
      );
    }

    // Create provider
    const provider = await prisma.provider.create({
      data: {
        id: `provider_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        walletAddress: walletAddress.toLowerCase(),
        name: name.trim(),
        description: description?.trim() || null,
        website: website?.trim() || null,
        avatarUrl: avatarUrl?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        reputationScore: 0,
        totalEarnings: '0',
        totalCalls: 0,
        isActive: true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: provider
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create provider' },
      { status: 500 }
    );
  }
}