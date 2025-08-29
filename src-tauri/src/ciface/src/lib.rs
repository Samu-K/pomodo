use proc_macro::TokenStream;
use quote::quote;
use syn::{DeriveInput, ImplItem, ItemImpl, parse_macro_input};

#[proc_macro_attribute]
pub fn tauri_commands(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let impl_block = parse_macro_input!(item as ItemImpl);

    let struct_name = match &*impl_block.self_ty {
        syn::Type::Path(type_path) => &type_path.path.segments.first().unwrap().ident,
        _ => panic!("Expected a struct type"),
    };

    let module_name = struct_name
        .to_string()
        .to_lowercase()
        .replace("actions", "");

    let mut command_functions = vec![];

    for item in &impl_block.items {
        if let ImplItem::Method(method) = item {
            // Skip private methods and new()
            if method.vis != syn::Visibility::Public || method.sig.ident == "new" {
                continue;
            }

            let method_name = &method.sig.ident;
            let command_name = format!("{}_{}", module_name, method_name);

            // Extract parameters (skip &self)
            let params: Vec<_> = method
                .sig
                .inputs
                .iter()
                .skip(1)
                .filter_map(|arg| {
                    if let syn::FnArg::Typed(pat_type) = arg {
                        Some(pat_type.clone())
                    } else {
                        None
                    }
                })
                .collect();

            let param_names: Vec<_> = params
                .iter()
                .filter_map(|p| {
                    if let syn::Pat::Ident(pat_ident) = &*p.pat {
                        Some(&pat_ident.ident)
                    } else {
                        None
                    }
                })
                .collect();

            let return_type = &method.sig.output;

            let command_fn = quote! {
                #[tauri::command(rename_all="snake_case")]
                pub async fn #command_name<'r>(
                    state: tauri::State<'r, AppState<'r>>,
                    #(#params),*
                ) #return_type {
                    state.#module_name.#method_name(#(#param_names),*).await
                }
            };

            command_functions.push(command_fn);
        }
    }

    let output = quote! {
        #impl_block

        #(#command_functions)*
    };

    TokenStream::from(output)
}
