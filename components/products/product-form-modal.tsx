"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { ProductWithCategory, Category } from "@/types"
import { Loader2, ImageOff } from "lucide-react"
import Image from "next/image"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category_id: z.string().optional(),
  cost_price: z.coerce.number().min(0),
  selling_price: z.coerce.number().min(0),
  stock_quantity: z.coerce.number().int().min(0),
  min_stock_level: z.coerce.number().int().min(0),
  supplier: z.string().optional(),
  expiry_date: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ProductFormModalProps {
  product: ProductWithCategory | null
  categories: Category[]
  onSaved: (product: ProductWithCategory) => void
  onClose: () => void
}

export function ProductFormModal({ product, categories, onSaved, onClose }: ProductFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(product?.image_url ?? "")
  const { toast } = useToast()
  const supabase = createClient()
  const isEdit = !!product

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      sku: product?.sku ?? "",
      barcode: product?.barcode ?? "",
      category_id: product?.category_id ?? "",
      cost_price: product?.cost_price ?? 0,
      selling_price: product?.selling_price ?? 0,
      stock_quantity: product?.stock_quantity ?? 0,
      min_stock_level: product?.min_stock_level ?? 5,
      supplier: product?.supplier ?? "",
      expiry_date: product?.expiry_date ?? "",
    },
  })

  const costPrice = watch("cost_price")
  const sellingPrice = watch("selling_price")
  const margin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice * 100).toFixed(1) : "0"

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      let image_url: string | null = product?.image_url ?? null

      // Upload image if provided
      if (imageFile) {
        const ext = imageFile.name.split(".").pop()
        const path = `products/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, imageFile, { upsert: true })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(path)
          image_url = urlData.publicUrl
        }
      }

      const payload = {
        name: data.name,
        description: data.description || null,
        sku: data.sku || null,
        barcode: data.barcode || null,
        category_id: data.category_id || null,
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        stock_quantity: data.stock_quantity,
        min_stock_level: data.min_stock_level,
        supplier: data.supplier || null,
        expiry_date: data.expiry_date || null,
        image_url,
        updated_at: new Date().toISOString(),
      }

      let saved: ProductWithCategory

      if (isEdit && product) {
        const { data: updated, error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id)
          .select("*, categories(id, name, color)")
          .single()
        if (error) throw error
        saved = updated as ProductWithCategory
      } else {
        const { data: created, error } = await supabase
          .from("products")
          .insert({ ...payload, is_active: true })
          .select("*, categories(id, name, color)")
          .single()
        if (error) throw error
        saved = created as ProductWithCategory
      }

      toast({
        title: isEdit ? "Product updated" : "Product created",
        description: `${data.name} has been ${isEdit ? "updated" : "added"} successfully.`,
      })
      onSaved(saved)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" className="mt-2">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-4">
              {/* Image upload */}
              <div>
                <Label className="mb-2 block">Product Image</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Preview" width={80} height={80} className="object-cover w-full h-full" />
                    ) : (
                      <ImageOff className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <label htmlFor="image" className="cursor-pointer">
                        Choose Image
                      </label>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="name" className="mb-2 block">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input id="name" {...register("name")} placeholder="Enter product name" className="h-11" />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <Label htmlFor="description" className="mb-2 block">Description</Label>
                <Input id="description" {...register("description")} placeholder="Optional description" />
              </div>

              <div>
                <Label className="mb-2 block">Category</Label>
                <Select
                  defaultValue={product?.category_id ?? ""}
                  onValueChange={(v) => setValue("category_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku" className="mb-2 block">SKU</Label>
                  <Input id="sku" {...register("sku")} placeholder="e.g. SKU-001" className="font-mono" />
                </div>
                <div>
                  <Label htmlFor="barcode" className="mb-2 block">Barcode</Label>
                  <Input id="barcode" {...register("barcode")} placeholder="Scan or enter" className="font-mono" />
                </div>
              </div>
            </TabsContent>

            {/* Pricing & Stock */}
            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_price" className="mb-2 block">
                    Cost Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("cost_price")}
                    className="h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="selling_price" className="mb-2 block">
                    Selling Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("selling_price")}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Margin indicator */}
              {Number(costPrice) > 0 && Number(sellingPrice) > 0 && (
                <div className={`p-3 rounded-lg text-sm font-medium ${
                  Number(margin) > 20 ? "bg-green-50 text-green-700" :
                  Number(margin) > 0 ? "bg-yellow-50 text-yellow-700" :
                  "bg-red-50 text-red-700"
                }`}>
                  Profit Margin: {margin}%
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock_quantity" className="mb-2 block">Current Stock</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    {...register("stock_quantity")}
                    className="h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="min_stock_level" className="mb-2 block">Min Stock Alert</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    min="0"
                    {...register("min_stock_level")}
                    className="h-11"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Details */}
            <TabsContent value="details" className="space-y-4">
              <div>
                <Label htmlFor="supplier" className="mb-2 block">Supplier</Label>
                <Input id="supplier" {...register("supplier")} placeholder="Supplier name" />
              </div>
              <div>
                <Label htmlFor="expiry_date" className="mb-2 block">Expiry Date</Label>
                <Input id="expiry_date" type="date" {...register("expiry_date")} />
                <p className="text-xs text-muted-foreground mt-1">For perishable items (grocery, bakery)</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isEdit ? "Save Changes" : "Add Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
